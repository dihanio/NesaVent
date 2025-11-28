const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');
const Withdrawal = require('../models/Withdrawal');
const { protect, protectAdmin, protectMitra } = require('../middleware/auth');
const { validateEvent, autoRejectDummyEvent } = require('../utils/eventValidator');
const { createNotification } = require('../controllers/notificationController');

// @desc    Get semua users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, protectAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user role (admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, protectAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'mitra', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    await user.deleteOne();
    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get semua events (admin only)
// @route   GET /api/admin/events
// @access  Private/Admin
router.get('/events', protect, protectAdmin, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('penyelenggara', 'nama email organisasi')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete event (admin only)
// @route   DELETE /api/admin/events/:slug
// @access  Private/Admin
router.delete('/events/:slug', protect, protectAdmin, async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    await event.deleteOne();
    res.json({ message: 'Event berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get dashboard statistics (admin/mitra)
// @route   GET /api/admin/dashboard
// @access  Private/Admin or Mitra
router.get('/dashboard', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin dashboard - show global stats
      const totalUsers = await User.countDocuments();
      const totalMitra = await User.countDocuments({ role: 'mitra' });
      const totalEvents = await Event.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalHarga' } } },
      ]);

      res.json({
        totalUsers,
        totalEvents,
        activeEvents: await Event.countDocuments({ status: 'aktif' }),
        totalTicketsSold: totalOrders, // Approximation
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        pendingOrders: await Order.countDocuments({ status: 'pending' }),
        pendingEvents: await Event.countDocuments({ status: 'pending' }),
        activeMitra: totalMitra,
        newUsersThisMonth: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        rejectedEvents: await Event.countDocuments({ status: 'ditolak' }),
      });
    } else if (req.user.role === 'mitra') {
      // Mitra dashboard - show partner's events and stats
      const partnerEvents = await Event.find({ createdBy: req.user._id });
      const totalEvents = partnerEvents.length;
      const activeEvents = partnerEvents.filter(e => e.status === 'aktif').length;
      const totalTicketsSold = await Order.countDocuments({
        event: { $in: partnerEvents.map(e => e._id) },
        status: 'paid'
      });
      const totalRevenue = await Order.aggregate([
        { $match: { event: { $in: partnerEvents.map(e => e._id) }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalHarga' } } },
      ]);
      const totalOrders = await Order.countDocuments({
        event: { $in: partnerEvents.map(e => e._id) }
      });
      const pendingEvents = partnerEvents.filter(e => e.status === 'pending').length;

      res.json({
        totalEvents,
        activeEvents,
        totalTicketsSold,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        pendingEvents,
      });
    } else {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get dashboard statistics (admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, protectAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMitra = await User.countDocuments({ role: 'mitra' });
    const totalEvents = await Event.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalHarga' } } },
    ]);

    res.json({
      totalUsers,
      totalMitra,
      totalEvents,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit event untuk verifikasi (mitra only)
// @route   PUT /api/admin/events/:slug/submit
// @access  Private/Mitra
router.put('/events/:slug/submit', protect, protectMitra, async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    // Cek ownership
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk event ini' });
    }

    // Cek apakah sudah verified atau pending
    if (event.status === 'pending' || event.status === 'aktif') {
      return res.status(400).json({ message: 'Event sudah dalam proses verifikasi atau sudah aktif' });
    }

    // Validasi apakah event dummy atau tidak
    const validation = isDummyEvent({
      nama: event.nama,
      deskripsi: event.deskripsi,
      tanggal: event.tanggal,
      waktu: event.waktu,
      lokasi: event.lokasi,
      penyelenggara: event.penyelenggara,
      tiketTersedia: event.tiketTersedia
    });

    if (validation.isDummy) {
      event.status = 'ditolak';
      event.alasanDitolak = validation.message;
      await event.save();
      
      return res.status(400).json({ 
        message: 'Event ditolak otomatis karena terdeteksi sebagai dummy/palsu',
        reasons: validation.reasons,
        score: validation.score
      });
    }

    // Jika lolos validasi, set ke pending
    event.status = 'pending';
    event.alasanDitolak = '';
    await event.save();

    res.json({ 
      message: 'Event berhasil diajukan untuk verifikasi admin',
      event 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get events pending verifikasi (admin only)
// @route   GET /api/admin/events/pending
// @access  Private/Admin
router.get('/events/pending', protect, protectAdmin, async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .populate('createdBy', 'nama email organisasi')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve event (admin only)
// @route   PUT /api/admin/events/:slug/approve
// @access  Private/Admin
router.put('/events/:slug/approve', protect, protectAdmin, async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    if (event.status !== 'pending') {
      return res.status(400).json({ message: 'Event tidak dalam status pending' });
    }

    event.status = 'aktif';
    event.isVerified = true;
    event.verifiedBy = req.user._id;
    event.verifiedAt = Date.now();
    event.alasanDitolak = '';
    
    await event.save();

    // Create notification for mitra
    await createNotification(
      event.createdBy,
      'event_approved',
      '🎉 Event Disetujui!',
      `Event "${event.nama}" telah disetujui dan sekarang aktif. Peserta sudah bisa membeli tiket!`,
      { relatedEvent: event._id }
    );

    res.json({ 
      message: 'Event berhasil disetujui dan dipublikasikan',
      event 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reject event (admin only)
// @route   PUT /api/admin/events/:slug/reject
// @access  Private/Admin
router.put('/events/:slug/reject', protect, protectAdmin, async (req, res) => {
  try {
    const { alasan } = req.body;
    
    if (!alasan || alasan.trim() === '') {
      return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
    }

    const event = await Event.findOne({ slug: req.params.slug });
    
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    if (event.status !== 'pending') {
      return res.status(400).json({ message: 'Event tidak dalam status pending' });
    }

    event.status = 'ditolak';
    event.isVerified = false;
    event.verifiedBy = req.user._id;
    event.verifiedAt = Date.now();
    event.alasanDitolak = alasan;
    
    await event.save();

    // Create notification for mitra
    await createNotification(
      event.createdBy,
      'event_rejected',
      '❌ Event Ditolak',
      `Event "${event.nama}" ditolak. Alasan: ${alasan}`,
      { relatedEvent: event._id }
    );

    res.json({ 
      message: 'Event ditolak',
      event 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all withdrawal requests (admin only)
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
router.get('/withdrawals', protect, protectAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('mitra', 'nama email organisasi')
      .populate('event', 'nama')
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get pending withdrawal requests (admin only)
// @route   GET /api/admin/withdrawals/pending
// @access  Private/Admin
router.get('/withdrawals/pending', protect, protectAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('mitra', 'nama email organisasi')
      .populate('event', 'nama')
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Process withdrawal request (admin only)
// @route   PUT /api/admin/withdrawals/:id/process
// @access  Private/Admin
router.put('/withdrawals/:id/process', protect, protectAdmin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Penarikan tidak ditemukan' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Penarikan tidak dalam status pending' });
    }

    withdrawal.status = 'completed';
    withdrawal.processedAt = Date.now();
    withdrawal.processedBy = req.user._id;

    await withdrawal.save();

    // Create notification for mitra
    await createNotification(
      withdrawal.mitra,
      'withdrawal_processed',
      '💰 Penarikan Dana Berhasil!',
      `Penarikan dana sebesar Rp ${withdrawal.jumlahDiterima.toLocaleString('id-ID')} telah diproses dan dikirim ke rekening Anda.`,
      { relatedWithdrawal: withdrawal._id }
    );

    res.json({
      message: 'Penarikan berhasil diproses',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reject withdrawal request (admin only)
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private/Admin
router.put('/withdrawals/:id/reject', protect, protectAdmin, async (req, res) => {
  try {
    const { alasan } = req.body;

    if (!alasan || alasan.trim() === '') {
      return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
    }

    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Penarikan tidak ditemukan' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Penarikan tidak dalam status pending' });
    }

    withdrawal.status = 'rejected';
    withdrawal.alasanDitolak = alasan;
    withdrawal.processedAt = Date.now();
    withdrawal.processedBy = req.user._id;

    await withdrawal.save();

    // Create notification for mitra
    await createNotification(
      withdrawal.mitra,
      'withdrawal_rejected',
      '❌ Penarikan Dana Ditolak',
      `Penarikan dana sebesar Rp ${withdrawal.jumlah.toLocaleString('id-ID')} ditolak. Alasan: ${alasan}`,
      { relatedWithdrawal: withdrawal._id }
    );

    res.json({
      message: 'Penarikan ditolak',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get pending student verifications (admin only)
// @route   GET /api/admin/student-verifications
// @access  Private/Admin
router.get('/student-verifications', protect, protectAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      studentVerificationStatus: 'pending'
    })
    .select('nama email nim programStudi fakultas ktm studentVerificationStatus studentVerificationNote createdAt')
    .sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve student verification (admin only)
// @route   PUT /api/admin/student-verifications/:userId/approve
// @access  Private/Admin
router.put('/student-verifications/:userId/approve', protect, protectAdmin, async (req, res) => {
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

    // Create notification for user
    await createNotification(
      user._id,
      'student_verification_approved',
      '✅ Verifikasi Mahasiswa Disetujui',
      'Selamat! Data mahasiswa Anda telah diverifikasi. Anda sekarang dapat membeli tiket khusus mahasiswa.',
      { verificationStatus: 'approved' }
    );

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
});

// @desc    Reject student verification (admin only)
// @route   PUT /api/admin/student-verifications/:userId/reject
// @access  Private/Admin
router.put('/student-verifications/:userId/reject', protect, protectAdmin, async (req, res) => {
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

    // Create notification for user
    await createNotification(
      user._id,
      'student_verification_rejected',
      '❌ Verifikasi Mahasiswa Ditolak',
      `Maaf, verifikasi mahasiswa Anda ditolak. Alasan: ${note}`,
      { verificationStatus: 'rejected' }
    );

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
});

module.exports = router;
