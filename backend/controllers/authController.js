const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { sendVerificationCode, sendPasswordResetCode } = require('../utils/emailService');

// Multer configuration for KTM upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ktm/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ktm-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadKTM = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'), false);
    }
  }
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user baru (hanya untuk user biasa dan mahasiswa)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { nama, email, password, nomorTelepon } = req.body;

    // Cek apakah user sudah ada
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Deteksi email mahasiswa
    const isMahasiswaEmail = email.endsWith('@mhs.unesa.ac.id');

    // Set role berdasarkan email
    // Registrasi publik hanya untuk user biasa dan mahasiswa
    const userRole = isMahasiswaEmail ? 'mahasiswa' : 'user';

    // Buat user baru
    const user = await User.create({
      nama,
      email,
      password,
      nomorTelepon,
      role: userRole,
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

    console.log(`[LOGIN] Attempting login for email: ${email}`);

    // Cek email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[LOGIN] User not found for email: ${email}`);
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    console.log(`[LOGIN] User found: ${user.nama} (${user.email})`);

    const isPasswordValid = await user.matchPassword(password);
    console.log(`[LOGIN] Password valid: ${isPasswordValid}`);

    if (isPasswordValid) {
      console.log(`[LOGIN] Login successful for: ${user.email}`);
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
      console.log(`[LOGIN] Password invalid for: ${user.email}`);
      res.status(401).json({ message: 'Email atau password salah' });
    }
  } catch (error) {
    console.error(`[LOGIN] Error:`, error);
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
        // Student fields
        nim: user.nim,
        programStudi: user.programStudi,
        fakultas: user.fakultas,
        ktm: user.ktm,
        studentVerificationStatus: user.studentVerificationStatus,
        studentVerificationNote: user.studentVerificationNote,
        isStudentVerified: user.studentVerificationStatus === 'approved', // Backward compatibility
        angkatan: user.angkatan, // Virtual field
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

    const { nama, email, nomorTelepon, organisasi, nim, programStudi, fakultas } = req.body;

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

    // Update student fields if user is mahasiswa
    if (user.role === 'user' || user.role === 'mahasiswa') {
      // Prevent updating student data if already approved
      if (user.studentVerificationStatus === 'approved') {
        return res.status(400).json({ message: 'Data mahasiswa sudah terverifikasi dan tidak dapat diubah' });
      }

      user.nim = nim !== undefined ? nim : user.nim;
      user.programStudi = programStudi !== undefined ? programStudi : user.programStudi;
      user.fakultas = fakultas !== undefined ? fakultas : user.fakultas;

      // Handle KTM file upload
      if (req.file) {
        user.ktm = req.file.filename;
      }

      // Set status to pending if all student data is complete and not already approved
      if (user.nim && user.programStudi && user.fakultas && user.ktm &&
          user.studentVerificationStatus !== 'approved') {
        user.studentVerificationStatus = 'pending';
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      nama: updatedUser.nama,
      email: updatedUser.email,
      nomorTelepon: updatedUser.nomorTelepon,
      role: updatedUser.role,
      organisasi: updatedUser.organisasi,
      nim: updatedUser.nim,
      programStudi: updatedUser.programStudi,
      fakultas: updatedUser.fakultas,
      ktm: updatedUser.ktm,
      studentVerificationStatus: updatedUser.studentVerificationStatus,
      studentVerificationNote: updatedUser.studentVerificationNote,
      isStudentVerified: updatedUser.studentVerificationStatus === 'approved', // Backward compatibility
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

// @desc    Get user public profile
// @route   GET /api/auth/public-profile/:slug
// @access  Public
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ slug: req.params.slug }).select('nama organisasi avatar slug');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Kode verifikasi salah atau sudah kedaluwarsa' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({
      _id: user._id,
      nama: user.nama,
      email: user.email,
      nomorTelepon: user.nomorTelepon,
      role: user.role,
      organisasi: user.organisasi,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password - kirim email reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[FORGOT PASSWORD] Request for email: ${email}`);

    // Cek apakah user ada
    const user = await User.findOne({ email });
    console.log(`[FORGOT PASSWORD] User found: ${!!user}`);

    if (!user) {
      // Untuk security, tetap return success meskipun email tidak ditemukan
      console.log(`[FORGOT PASSWORD] User not found, returning success for security`);
      return res.json({ message: 'Jika email terdaftar, kode reset password telah dikirim.' });
    }

    // Generate reset password code (OTP)
    const resetPasswordCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordCode = resetPasswordCode;
    user.resetPasswordCodeExpires = resetPasswordCodeExpires;
    await user.save();
    console.log(`[FORGOT PASSWORD] Generated code: ${resetPasswordCode}, expires: ${resetPasswordCodeExpires}`);

    // Send password reset email
    try {
      console.log(`[FORGOT PASSWORD] Attempting to send email to: ${email}`);
      await sendPasswordResetCode(email, resetPasswordCode);
      console.log(`[FORGOT PASSWORD] Email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error(`[FORGOT PASSWORD] Failed to send email to ${email}:`, emailError);
      // Don't fail the request if email fails, just log it
    }

    res.json({
      message: 'Kode reset password telah dikirim ke email Anda.',
      email: email
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD] Unexpected error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan. Silakan coba lagi.' });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    try {
      await sendVerificationCode(email, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.json({ message: 'Kode verifikasi baru telah dikirim ke email Anda' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    console.log(`[RESET PASSWORD] Attempting reset for email: ${email}, code: ${code}`);

    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log(`[RESET PASSWORD] User/code not found or expired for: ${email}`);
      return res.status(400).json({ message: 'Kode reset password salah atau sudah kedaluwarsa' });
    }

    console.log(`[RESET PASSWORD] User found: ${user.nama} (${user.email})`);
    console.log(`[RESET PASSWORD] Old password hash starts with: ${user.password.substring(0, 10)}...`);
    console.log(`[RESET PASSWORD] Setting new password: ${newPassword.substring(0, 3)}...`);

    // Update password
    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;

    // Ensure password is marked as modified
    user.markModified('password');

    await user.save();

    console.log(`[RESET PASSWORD] Password reset successful for: ${user.email}`);
    console.log(`[RESET PASSWORD] New password hash starts with: ${user.password.substring(0, 10)}...`);

    res.json({ message: 'Password berhasil direset' });
  } catch (error) {
    console.error(`[RESET PASSWORD] Error:`, error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
  changePassword,
  getPublicProfile,
  forgotPassword,
  verifyCode,
  resendVerificationCode,
  resetPassword,
  uploadKTM,
};
