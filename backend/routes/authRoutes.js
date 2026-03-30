// ═══════════════════════════════════════════════════════════════
// routes/authRoutes.js
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/validators');
const { uploadImage, setUploadFolder } = require('../middleware/uploadMiddleware');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, setUploadFolder('avatars'), uploadImage.single('avatar'), authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
