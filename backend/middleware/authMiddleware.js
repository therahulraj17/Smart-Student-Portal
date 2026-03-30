const { verifyAccessToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('./errorMiddleware');

/**
 * Protect routes — verify JWT access token
 * Supports both cookie and Authorization header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header first, then cookie
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError('Not authorized, no token provided', 401);
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Check if user still exists and is active
  const user = await User.findById(decoded.id).select('-password -refreshTokens');
  if (!user) throw new ApiError('User not found', 401);
  if (!user.isActive) throw new ApiError('Account deactivated. Contact admin.', 403);

  req.user = user;
  next();
});

/**
 * Role-based access control middleware
 * Usage: authorize('admin', 'teacher')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(
      `Role '${req.user.role}' is not authorized to access this route`,
      403
    );
  }
  next();
};

/**
 * Optional auth — attaches user if token present, doesn't block if not
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.id).select('-password -refreshTokens');
    } catch {
      // Silent — not required
    }
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };
