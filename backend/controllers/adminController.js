const User = require('../models/User');

// @desc    Get all users with student verification pending
// @route   GET /api/admin/student-verifications
// @access  Private (Admin only)
const getPendingStudentVerifications = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      studentVerificationStatus: 'pending'
    })
    .select('nama email nim programStudi fakultas ktm studentVerificationStatus createdAt')
    .sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve student verification
// @route   PUT /api/admin/student-verifications/:userId/approve
// @access  Private (Admin only)
const approveStudentVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.studentVerificationStatus !== 'pending') {
      return res.status(400).json({ message: 'User tidak dalam status pending verifikasi' });
    }

    user.studentVerificationStatus = 'approved';
    user.studentVerificationNote = note || 'Verifikasi mahasiswa disetujui';

    await user.save();

    res.json({
      message: 'Verifikasi mahasiswa berhasil disetujui',
      user: {
        _id: user._id,
        nama: user.nama,
        email: user.email,
        studentVerificationStatus: user.studentVerificationStatus,
        studentVerificationNote: user.studentVerificationNote
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject student verification
// @route   PUT /api/admin/student-verifications/:userId/reject
// @access  Private (Admin only)
const rejectStudentVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.studentVerificationStatus !== 'pending') {
      return res.status(400).json({ message: 'User tidak dalam status pending verifikasi' });
    }

    user.studentVerificationStatus = 'rejected';
    user.studentVerificationNote = note;

    await user.save();

    res.json({
      message: 'Verifikasi mahasiswa ditolak',
      user: {
        _id: user._id,
        nama: user.nama,
        email: user.email,
        studentVerificationStatus: user.studentVerificationStatus,
        studentVerificationNote: user.studentVerificationNote
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingStudentVerifications,
  approveStudentVerification,
  rejectStudentVerification,
  getAllUsers
};