const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
  changePassword,
  getPublicProfile,
  forgotPassword,
  verifyCode,
  resendVerificationCode,
  resetPassword,
  uploadKTM,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../utils/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  handleValidationErrors
} = require('../utils/validators');

// Auth routes with rate limiting and validation
router.post('/register', authLimiter, validateRegistration, handleValidationErrors, registerUser);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-code', authLimiter, verifyCode);
router.post('/resend-code', authLimiter, resendVerificationCode);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, uploadKTM.single('ktm'), validateProfileUpdate, handleValidationErrors, updateProfile);
router.put('/profile/cover', protect, uploadKTM.single('coverImage'), updateProfile);
router.put('/password', protect, validatePasswordChange, handleValidationErrors, changePassword);

// Public profile
router.get('/public-profile/:slug', getPublicProfile);

module.exports = router;
