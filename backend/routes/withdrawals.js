const express = require('express');
const router = express.Router();
const { protect, protectMitra } = require('../middleware/auth');
const {
  getWithdrawals,
  getBalance,
  getEventEarnings,
  createWithdrawal,
  cancelWithdrawal
} = require('../controllers/withdrawalController');

router.use(protect);
router.use(protectMitra);

router.get('/', getWithdrawals);
router.get('/balance', getBalance);
router.get('/events', getEventEarnings);
router.post('/', createWithdrawal);
router.delete('/:id', cancelWithdrawal);

module.exports = router;
