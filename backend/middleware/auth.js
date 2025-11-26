const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Ambil token dari header
      token = req.headers.authorization.split(' ')[1];

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ambil data user dari token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Tidak memiliki akses, token tidak valid' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Tidak memiliki akses, token tidak ditemukan' });
  }
};

// Middleware untuk mitra dan admin
const protectMitra = async (req, res, next) => {
  if (req.user && (req.user.role === 'mitra' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Hanya untuk mitra dan admin.' });
  }
};

// Middleware untuk admin saja
const protectAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Hanya untuk admin.' });
  }
};

// Middleware untuk user biasa saja
const protectUser = async (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Hanya untuk user biasa.' });
  }
};

module.exports = { protect, protectMitra, protectAdmin, protectUser };
