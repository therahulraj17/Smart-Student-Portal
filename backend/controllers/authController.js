const crypto = require('crypto');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');
const {
  generateAccessToken, generateRefreshToken,
  verifyRefreshToken, setTokenCookies, clearTokenCookies, createTokenPayload,
} = require('../utils/jwtUtils');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const logger = require('../utils/logger');

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, studentId } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError('Email already registered', 409);

  const user = await User.create({ name, email, password, role, studentId });

  const payload = createTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await user.addRefreshToken(refreshToken);
  setTokenCookies(res, accessToken, refreshToken);

  logger.info(`New user registered: ${email} (${role})`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar,
      },
      accessToken,
    },
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Select password field explicitly (it's hidden by default)
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError('Invalid email or password', 401);
  }

  if (!user.isActive) throw new ApiError('Account deactivated. Contact admin.', 403);

  user.lastLogin = new Date();
  const payload = createTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await user.addRefreshToken(refreshToken);
  setTokenCookies(res, accessToken, refreshToken);

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar,
        enrolledCourses: user.enrolledCourses,
        teachingCourses: user.teachingCourses,
      },
      accessToken,
    },
  });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ApiError('No refresh token provided', 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    throw new ApiError('Refresh token revoked or invalid', 401);
  }

  // Rotate refresh token (remove old, add new)
  await user.removeRefreshToken(token);
  const payload = createTokenPayload(user);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);
  await user.addRefreshToken(newRefreshToken);

  setTokenCookies(res, newAccessToken, newRefreshToken);

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken },
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token && req.user) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) await user.removeRefreshToken(token);
  }

  clearTokenCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─── Get Current User ─────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('enrolledCourses', 'name code')
    .populate('teachingCourses', 'name code');

  res.status(200).json({ success: true, data: { user } });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'notificationPreferences'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (req.file) {
    updates.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
});

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError('Current and new password required', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all refresh tokens to force re-login on other devices
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });

  clearTokenCookies(res);
  res.status(200).json({ success: true, message: 'Password changed. Please login again.' });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError('Email could not be sent. Try again later.', 500);
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+refreshTokens');

  if (!user) throw new ApiError('Reset token is invalid or has expired', 400);

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });
});
