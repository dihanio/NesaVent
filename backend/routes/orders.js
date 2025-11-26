const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
} = require('../controllers/orderController');
const { protect, protectUser } = require('../middleware/auth');

router.route('/').get(protect, getAllOrders).post(protect, protectUser, createOrder);
router.route('/my-orders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;
