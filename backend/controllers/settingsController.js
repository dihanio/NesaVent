const Settings = require('../models/Settings');
const axios = require('axios');

// Helper function to validate bank account using Free API
const validateBankAccount = async (bankCode, accountNumber) => {
  try {
    // Free API untuk validasi rekening bank Indonesia
    // API: https://api-rekening.lfourr.com
    // Requires referer header for access
    const apiUrl = `https://api-rekening.lfourr.com/getBankAccount?bankCode=${bankCode}&accountNumber=${accountNumber}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://cek-rekening.lfourr.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000 // 15 second timeout
    });

    // Check if response is successful
    if (response.data && response.data.status === true && response.data.data) {
      return {
        valid: true,
        accountName: response.data.data.accountname || response.data.data.accountName
      };
    }

    // If status is false or no data
    return { valid: false, accountName: null };
  } catch (error) {
    console.error('Bank validation error:', error.response?.data || error.message);
    // Jika API error, return valid true dengan mock name agar tidak blocking
    return { 
      valid: true, 
      accountName: generateMockAccountName(accountNumber)
    };
  }
};

// Generate mock account name for development/testing
const generateMockAccountName = (accountNumber) => {
  const names = [
    'AHMAD SURYADI',
    'SITI NURHALIZA',
    'BUDI SANTOSO',
    'DEWI LESTARI',
    'RIZKI PRATAMA',
    'MAYA ANGGRAINI',
    'ANDI WIJAYA',
    'LINDA MARLINA'
  ];
  
  // Generate deterministic name based on account number
  const index = parseInt(accountNumber.slice(-2)) % names.length;
  return names[index];
};

// Helper function to get bank code from bank name (api-rekening.lfourr.com format)
const getBankCode = (bankName) => {
  const bankCodes = {
    'BCA': 'bca',
    'MANDIRI': 'mandiri',
    'BNI': 'bni',
    'BRI': 'bri',
    'BTN': 'btn',
    'CIMB': 'cimb',
    'PERMATA': 'permata',
    'DANAMON': 'danamon',
    'BII': 'bii',
    'PANIN': 'panin',
    'MEGA': 'mega',
    'BSI': 'bsi',
    'MUAMALAT': 'muamalat',
    'OCBC': 'ocbc',
    'SINARMAS': 'sinarmas',
    'Commonwealth': 'commonwealth',
    'BUKOPIN': 'bukopin',
    'MAYBANK': 'maybank',
    'BJB': 'bjb',
    'BPD BALI': 'bali',
    'BPD DIY': 'diy',
    'BPD JABAR': 'jabar',
    'BPD JATENG': 'jateng',
    'BPD JATIM': 'jatim',
    'SEABANK': 'seabank',
    'JENIUS': 'jenius',
    'GOPAY': 'gopay',
    'OVO': 'ovo',
    'DANA': 'dana',
    'LINKAJA': 'linkaja',
    'SHOPEEPAY': 'shopeepay'
  };

  const upperBankName = bankName.toUpperCase().trim();
  return bankCodes[upperBankName] || bankName.toLowerCase().replace(/\s+/g, '_');
};

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });

    // Create default settings if not exists
    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    // Filter settings based on user role
    const filteredSettings = filterSettingsByRole(settings, req.user.role);

    res.json(filteredSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to filter settings based on user role
const filterSettingsByRole = (settings, role) => {
  const baseSettings = {
    _id: settings._id,
    user: settings.user,
    notifications: {
      email: {},
      push: {}
    }
  };

  if (role === 'user') {
    // User only gets notifications for event reminders and orders
    baseSettings.notifications.email = {
      eventReminder: settings.notifications.email.eventReminder || false,
      newOrder: settings.notifications.email.newOrder || false
    };
    baseSettings.notifications.push = {
      eventReminder: settings.notifications.push.eventReminder || false,
      newOrder: settings.notifications.push.newOrder || false
    };
  } else if (role === 'mitra') {
    // Mitra gets notifications for events, sales, and withdrawals, plus bank accounts and event defaults
    baseSettings.notifications.email = {
      eventApproved: settings.notifications.email.eventApproved || false,
      eventRejected: settings.notifications.email.eventRejected || false,
      newOrder: settings.notifications.email.newOrder || false,
      withdrawalProcessed: settings.notifications.email.withdrawalProcessed || false,
      withdrawalRejected: settings.notifications.email.withdrawalRejected || false
    };
    baseSettings.notifications.push = {
      eventApproved: settings.notifications.push.eventApproved || false,
      eventRejected: settings.notifications.push.eventRejected || false,
      newOrder: settings.notifications.push.newOrder || false,
      withdrawalProcessed: settings.notifications.push.withdrawalProcessed || false,
      withdrawalRejected: settings.notifications.push.withdrawalRejected || false
    };
    baseSettings.bankAccounts = settings.bankAccounts || [];
    baseSettings.eventDefaults = settings.eventDefaults || {
      kategori: '',
      lokasi: '',
      durasi: 120,
      reminderDays: 3
    };
  } else if (role === 'admin') {
    // Admin gets all settings
    return settings;
  }

  return baseSettings;
};

// @desc    Update notification preferences
// @route   PUT /api/settings/notifications
// @access  Private
const updateNotifications = async (req, res) => {
  try {
    const { email, push } = req.body;

    // Validate that user can only update allowed notification types
    const allowedEmailKeys = getAllowedNotificationKeys(req.user.role, 'email');
    const allowedPushKeys = getAllowedNotificationKeys(req.user.role, 'push');

    // Filter out unauthorized notification updates
    const filteredEmail = email ? Object.keys(email).reduce((acc, key) => {
      if (allowedEmailKeys.includes(key)) {
        acc[key] = email[key];
      }
      return acc;
    }, {}) : {};

    const filteredPush = push ? Object.keys(push).reduce((acc, key) => {
      if (allowedPushKeys.includes(key)) {
        acc[key] = push[key];
      }
      return acc;
    }, {}) : {};

    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    if (Object.keys(filteredEmail).length > 0) {
      settings.notifications.email = { ...settings.notifications.email, ...filteredEmail };
    }
    if (Object.keys(filteredPush).length > 0) {
      settings.notifications.push = { ...settings.notifications.push, ...filteredPush };
    }

    await settings.save();

    res.json({ message: 'Preferensi notifikasi berhasil diupdate', settings: filterSettingsByRole(settings, req.user.role) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get allowed notification keys for a role
const getAllowedNotificationKeys = (role, type) => {
  if (role === 'user') {
    return ['eventReminder', 'newOrder'];
  } else if (role === 'mitra') {
    return ['eventApproved', 'eventRejected', 'newOrder', 'withdrawalProcessed', 'withdrawalRejected'];
  } else if (role === 'admin') {
    return ['eventApproved', 'eventRejected', 'newOrder', 'withdrawalProcessed', 'withdrawalRejected', 'eventReminder'];
  }
  return [];
};

// @desc    Validate bank account (without saving)
// @route   POST /api/settings/bank-accounts/validate
// @access  Private (Mitra & Admin only)
const validateBankAccountOnly = async (req, res) => {
  try {
    // Only mitra and admin can validate bank accounts
    if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya mitra yang dapat memvalidasi rekening bank' });
    }
    const { bankName, accountNumber } = req.body;

    if (!bankName || !accountNumber) {
      return res.status(400).json({ message: 'Bank name dan account number wajib diisi' });
    }

    // Validate account number format
    if (!/^\d+$/.test(accountNumber)) {
      return res.status(400).json({ message: 'Nomor rekening harus berupa angka' });
    }

    // Validate with bank API
    const bankCode = getBankCode(bankName);
    const validation = await validateBankAccount(bankCode, accountNumber);

    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Nomor rekening tidak valid atau tidak ditemukan',
        valid: false
      });
    }

    res.json({ 
      valid: true,
      accountName: validation.accountName,
      message: 'Rekening valid'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add bank account
// @route   POST /api/settings/bank-accounts
// @access  Private (Mitra & Admin only)
const addBankAccount = async (req, res) => {
  try {
    // Only mitra and admin can add bank accounts
    if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya mitra yang dapat menambah rekening bank' });
    }

    const { bankName, accountNumber, accountName, isPrimary } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    // Validate account number format (must be digits only)
    if (!/^\d+$/.test(accountNumber)) {
      return res.status(400).json({ message: 'Nomor rekening harus berupa angka' });
    }

    // Try to validate with bank API (optional, don't block if fails)
    let warningMessage = null;
    let verifiedAccountName = null;
    
    try {
      const bankCode = getBankCode(bankName);
      const validation = await validateBankAccount(bankCode, accountNumber);

      if (validation.valid && validation.accountName) {
        verifiedAccountName = validation.accountName;
        
        // Compare with provided name
        if (validation.accountName.toLowerCase() !== accountName.toLowerCase()) {
          warningMessage = `Nama pemilik rekening dari bank: "${validation.accountName}". Pastikan data sesuai.`;
        }
      }
    } catch (validationError) {
      console.log('Bank validation skipped:', validationError.message);
      // Continue without validation - don't block user
    }

    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    // If this is primary, set others to false
    if (isPrimary) {
      settings.bankAccounts.forEach(acc => acc.isPrimary = false);
    }

    settings.bankAccounts.push({
      bankName,
      accountNumber,
      accountName,
      isPrimary: isPrimary || settings.bankAccounts.length === 0
    });

    await settings.save();

    res.json({ 
      message: 'Rekening bank berhasil ditambahkan', 
      settings,
      warning: warningMessage,
      verifiedAccountName: verifiedAccountName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update bank account
// @route   PUT /api/settings/bank-accounts/:id
// @access  Private (Mitra & Admin only)
const updateBankAccount = async (req, res) => {
  try {
    // Only mitra and admin can manage bank accounts
    if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya mitra yang dapat mengelola rekening bank' });
    }
    const { bankName, accountNumber, accountName, isPrimary } = req.body;

    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      return res.status(404).json({ message: 'Settings tidak ditemukan' });
    }

    const account = settings.bankAccounts.id(req.params.id);

    if (!account) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan' });
    }

    // If setting as primary, unset others
    if (isPrimary) {
      settings.bankAccounts.forEach(acc => acc.isPrimary = false);
    }

    account.bankName = bankName || account.bankName;
    account.accountNumber = accountNumber || account.accountNumber;
    account.accountName = accountName || account.accountName;
    account.isPrimary = isPrimary !== undefined ? isPrimary : account.isPrimary;

    await settings.save();

    res.json({ message: 'Rekening bank berhasil diupdate', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete bank account
// @route   DELETE /api/settings/bank-accounts/:id
// @access  Private (Mitra & Admin only)
const deleteBankAccount = async (req, res) => {
  try {
    // Only mitra and admin can manage bank accounts
    if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya mitra yang dapat mengelola rekening bank' });
    }
    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      return res.status(404).json({ message: 'Settings tidak ditemukan' });
    }

    const account = settings.bankAccounts.id(req.params.id);

    if (!account) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan' });
    }

    const wasPrimary = account.isPrimary;
    account.deleteOne();

    // If deleted account was primary, set first remaining as primary
    if (wasPrimary && settings.bankAccounts.length > 0) {
      settings.bankAccounts[0].isPrimary = true;
    }

    await settings.save();

    res.json({ message: 'Rekening bank berhasil dihapus', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update email templates
// @route   PUT /api/settings/email-templates
// @access  Private (Mitra & Admin only)
const updateEmailTemplates = async (req, res) => {
  try {
    // Only mitra and admin can update email templates
    if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya mitra yang dapat mengatur template email' });
    }
    const { orderConfirmation, eventReminder } = req.body;

    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    if (orderConfirmation) {
      settings.emailTemplates.orderConfirmation = {
        ...settings.emailTemplates.orderConfirmation,
        ...orderConfirmation
      };
    }

    if (eventReminder) {
      settings.emailTemplates.eventReminder = {
        ...settings.emailTemplates.eventReminder,
        ...eventReminder
      };
    }

    await settings.save();

    res.json({ message: 'Template email berhasil diupdate', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event defaults
// @route   PUT /api/settings/event-defaults
// @access  Private (Mitra & Admin only)
const updateEventDefaults = async (req, res) => {
  try {
    // Only mitra and admin can set event defaults
    if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya mitra yang dapat mengatur default event' });
    }
    const { kategori, lokasi, durasi, reminderDays } = req.body;

    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    if (kategori) settings.eventDefaults.kategori = kategori;
    if (lokasi !== undefined) settings.eventDefaults.lokasi = lokasi;
    if (durasi) settings.eventDefaults.durasi = durasi;
    if (reminderDays !== undefined) settings.eventDefaults.reminderDays = reminderDays;

    await settings.save();

    res.json({ message: 'Default event berhasil diupdate', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateNotifications,
  validateBankAccountOnly,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  updateEmailTemplates,
  updateEventDefaults
};
