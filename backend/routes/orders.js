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

router.route('/').get(protect, getAllOrders).post(protect, protectUser, createOrder);
router.route('/my-orders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).put(protect, updateOrderDetails);
router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;
