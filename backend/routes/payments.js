const express = require('express');
const router = express.Router();
const {
  createPayment,
  handleNotification,
  simulatePayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createPayment);
router.post('/notification', handleNotification);
router.post('/simulate/:orderId', protect, simulatePayment); // Development only

module.exports = router;
