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

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendVerificationCode);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, uploadKTM.single('ktm'), updateProfile);
router.put('/password', protect, changePassword);
router.get('/public-profile/:slug', getPublicProfile);

module.exports = router;
