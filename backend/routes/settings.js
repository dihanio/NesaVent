const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSettings,
  updateNotifications,
  validateBankAccountOnly,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  updateEmailTemplates,
  updateEventDefaults
} = require('../controllers/settingsController');

router.use(protect);

router.get('/', getSettings);
router.put('/notifications', updateNotifications);
router.post('/bank-accounts/validate', validateBankAccountOnly);
router.post('/bank-accounts', addBankAccount);
router.put('/bank-accounts/:id', updateBankAccount);
router.delete('/bank-accounts/:id', deleteBankAccount);
router.put('/email-templates', updateEmailTemplates);
router.put('/event-defaults', updateEventDefaults);

module.exports = router;
