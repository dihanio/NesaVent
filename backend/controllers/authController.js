const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user baru
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { nama, email, password, nomorTelepon, role, organisasi } = req.body;

    // Cek apakah user sudah ada
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Validasi role
    const validRoles = ['user', 'mitra'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // Buat user baru
    const user = await User.create({
      nama,
      email,
      password,
      nomorTelepon,
      role: userRole,
      organisasi: userRole === 'mitra' ? organisasi : undefined,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nama: user.nama,
        email: user.email,
        nomorTelepon: user.nomorTelepon,
        role: user.role,
        organisasi: user.organisasi,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Data user tidak valid' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        nama: user.nama,
        email: user.email,
        nomorTelepon: user.nomorTelepon,
        role: user.role,
        organisasi: user.organisasi,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email atau password salah' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        nama: user.nama,
        email: user.email,
        nomorTelepon: user.nomorTelepon,
        role: user.role,
        organisasi: user.organisasi,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const { nama, email, nomorTelepon, organisasi } = req.body;

    // Cek apakah email baru sudah digunakan user lain
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email sudah digunakan' });
      }
    }

    // Update fields
    user.nama = nama || user.nama;
    user.email = email || user.email;
    user.nomorTelepon = nomorTelepon !== undefined ? nomorTelepon : user.nomorTelepon;
    if (user.role === 'mitra' || user.role === 'admin') {
      user.organisasi = organisasi !== undefined ? organisasi : user.organisasi;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      nama: updatedUser.nama,
      email: updatedUser.email,
      nomorTelepon: updatedUser.nomorTelepon,
      role: updatedUser.role,
      organisasi: updatedUser.organisasi,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password lama tidak sesuai' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
  changePassword,
};
