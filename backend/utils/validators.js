const { body, param, query, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validasi gagal',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama harus antara 3-100 karakter')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Nama hanya boleh berisi huruf dan spasi'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password harus mengandung huruf dan angka'),
  
  body('nomorTelepon')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor telepon tidak valid'),
  
  body('role')
    .optional()
    .isIn(['user', 'mahasiswa', 'mitra']).withMessage('Role tidak valid'),
  
  handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password wajib diisi'),
  
  handleValidationErrors
];

/**
 * Validation rules for event creation
 */
const validateEventCreation = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama event wajib diisi')
    .isLength({ min: 5, max: 200 }).withMessage('Nama event harus antara 5-200 karakter'),
  
  body('deskripsi')
    .trim()
    .notEmpty().withMessage('Deskripsi wajib diisi')
    .isLength({ min: 20, max: 5000 }).withMessage('Deskripsi harus antara 20-5000 karakter'),
  
  body('tanggal')
    .notEmpty().withMessage('Tanggal wajib diisi')
    .isISO8601().withMessage('Format tanggal tidak valid')
    .custom((value) => {
      const eventDate = new Date(value);
      const now = new Date();
      if (eventDate < now) {
        throw new Error('Tanggal event tidak boleh di masa lalu');
      }
      return true;
    }),
  
  body('waktu')
    .notEmpty().withMessage('Waktu wajib diisi')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Format waktu tidak valid (HH:mm)'),
  
  body('lokasi')
    .trim()
    .notEmpty().withMessage('Lokasi wajib diisi')
    .isLength({ min: 5, max: 200 }).withMessage('Lokasi harus antara 5-200 karakter'),
  
  body('kategori')
    .notEmpty().withMessage('Kategori wajib diisi')
    .isIn(['Musik', 'Olahraga', 'Seminar', 'Workshop', 'Festival', 'Lainnya']).withMessage('Kategori tidak valid'),
  
  body('tiketTersedia')
    .isArray({ min: 1 }).withMessage('Minimal harus ada 1 tipe tiket'),
  
  body('tiketTersedia.*.nama')
    .trim()
    .notEmpty().withMessage('Nama tiket wajib diisi'),
  
  body('tiketTersedia.*.harga')
    .isInt({ min: 0 }).withMessage('Harga tiket harus angka positif'),
  
  body('tiketTersedia.*.stok')
    .isInt({ min: 1 }).withMessage('Stok tiket minimal 1'),
  
  handleValidationErrors
];

/**
 * Validation rules for order creation
 */
const validateOrderCreation = [
  body('eventId')
    .notEmpty().withMessage('Event ID wajib diisi')
    .isMongoId().withMessage('Format Event ID tidak valid'),
  
  body('ticketSelections')
    .isArray({ min: 1 }).withMessage('Minimal pilih 1 tiket'),
  
  body('ticketSelections.*.ticketTypeId')
    .notEmpty().withMessage('Ticket Type ID wajib diisi')
    .isMongoId().withMessage('Format Ticket Type ID tidak valid'),
  
  body('ticketSelections.*.quantity')
    .isInt({ min: 1, max: 10 }).withMessage('Jumlah tiket harus antara 1-10'),
  
  handleValidationErrors
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Nama harus antara 3-100 karakter'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('nomorTelepon')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor telepon tidak valid'),
  
  body('nim')
    .optional()
    .trim()
    .matches(/^\d{11}$/).withMessage('NIM harus 11 digit angka'),
  
  handleValidationErrors
];

/**
 * Validation rules for password change
 */
const validatePasswordChange = [
  body('oldPassword')
    .notEmpty().withMessage('Password lama wajib diisi'),
  
  body('newPassword')
    .notEmpty().withMessage('Password baru wajib diisi')
    .isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password baru harus mengandung huruf dan angka'),
  
  handleValidationErrors
];

/**
 * Validation rules for MongoDB ID param
 */
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Format ${paramName} tidak valid`),
  
  handleValidationErrors
];

/**
 * Validation rules for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page harus angka positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit harus antara 1-100'),
  
  handleValidationErrors
];

/**
 * Sanitize MongoDB operators (Custom implementation for Express 5 compatibility)
 */
const sanitizeMongoOperators = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        // Remove keys that start with $ or contain .
        if (key.startsWith('$') || key.includes('.')) {
          console.warn(`Sanitized potential MongoDB injection: ${key} from ${req.ip}`);
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    }
  };

  // Sanitize req.body (mutable)
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize req.params (mutable)
  if (req.params) {
    sanitizeObject(req.params);
  }

  // For req.query (immutable in Express 5), we need to replace it
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = { ...req.query };
    sanitizeObject(sanitizedQuery);
    
    // Create new query object without dangerous operators
    const cleanQuery = {};
    Object.keys(sanitizedQuery).forEach(key => {
      if (!key.startsWith('$') && !key.includes('.')) {
        cleanQuery[key] = sanitizedQuery[key];
      }
    });
    
    // Replace query with sanitized version
    Object.defineProperty(req, 'query', {
      value: cleanQuery,
      writable: false,
      configurable: true
    });
  }

  next();
};

/**
 * XSS Protection - Sanitize HTML
 */
const sanitizeHTML = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      } else {
        obj[key] = sanitizeValue(obj[key]);
      }
    });
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateEventCreation,
  validateOrderCreation,
  validateProfileUpdate,
  validatePasswordChange,
  validateMongoId,
  validatePagination,
  sanitizeMongoOperators,
  sanitizeHTML
};
