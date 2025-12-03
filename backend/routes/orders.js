const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderDetails,
} = require('../controllers/orderController');
const { protect, protectUser } = require('../middleware/auth');
const { orderLimiter } = require('../utils/rateLimiter');
const { validateOrderCreation, handleValidationErrors } = require('../utils/validators');

// Order management routes
router.get('/', protect, getAllOrders);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Create order with rate limiting and validation
router.post('/', protect, protectUser, orderLimiter, validateOrderCreation, handleValidationErrors, createOrder);

// Update order
router.put('/:id', protect, updateOrderDetails);
router.put('/:id/pay', protect, updateOrderToPaid);

module.exports = router;
