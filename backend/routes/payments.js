const express = require('express');
const router = express.Router();
const {
  createPayment,
  handleNotification,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createPayment);
router.post('/notification', handleNotification);

module.exports = router;
