const Withdrawal = require('../models/Withdrawal');
const Order = require('../models/Order');
const Event = require('../models/Event');

// @desc    Get withdrawal history untuk mitra
// @route   GET /api/withdrawals
// @access  Private/Mitra
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ mitra: req.user._id })
      .populate('event', 'nama')
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saldo available untuk withdrawal
// @route   GET /api/withdrawals/balance
// @access  Private/Mitra
const getBalance = async (req, res) => {
  try {
    // Get semua event milik mitra
    const events = await Event.find({ createdBy: req.user._id });
    const eventIds = events.map(e => e._id);

    // Hitung total pendapatan dari order yang paid
    const orders = await Order.find({
      event: { $in: eventIds },
      status: 'paid'
    });

    const totalPendapatan = orders.reduce((sum, order) => sum + order.totalHarga, 0);

    // Hitung total yang sudah ditarik (completed)
    const withdrawals = await Withdrawal.find({
      mitra: req.user._id,
      status: 'completed'
    });

    const totalDitarik = withdrawals.reduce((sum, w) => sum + w.jumlah, 0);

    // Hitung yang sedang diproses
    const withdrawalsPending = await Withdrawal.find({
      mitra: req.user._id,
      status: { $in: ['pending', 'processing'] }
    });

    const totalPending = withdrawalsPending.reduce((sum, w) => sum + w.jumlah, 0);

    res.json({
      totalPendapatan,
      totalDitarik,
      totalPending,
      saldoTersedia: totalPendapatan - totalDitarik - totalPending,
      orders: orders.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pendapatan per event
// @route   GET /api/withdrawals/events
// @access  Private/Mitra
const getEventEarnings = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id });
    
    const eventEarnings = await Promise.all(
      events.map(async (event) => {
        const orders = await Order.find({
          event: event._id,
          status: 'paid'
        });

        const totalPendapatan = orders.reduce((sum, order) => sum + order.totalHarga, 0);
        const totalTiketTerjual = orders.reduce((sum, order) => {
          return sum + (order.items?.reduce((itemSum, item) => itemSum + item.jumlah, 0) || order.jumlahTiket || 0);
        }, 0);

        return {
          eventId: event._id,
          eventNama: event.nama,
          totalPendapatan,
          totalTiketTerjual,
          totalOrder: orders.length,
          status: event.status
        };
      })
    );

    res.json(eventEarnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private/Mitra
const createWithdrawal = async (req, res) => {
  try {
    const { jumlah, bankName, accountNumber, accountName, eventId, keterangan } = req.body;

    // Validasi jumlah minimal
    if (jumlah < 10000) {
      return res.status(400).json({ message: 'Jumlah penarikan minimal Rp 10.000' });
    }

    // Cek saldo tersedia
    const events = await Event.find({ createdBy: req.user._id });
    const eventIds = events.map(e => e._id);

    let query = {
      event: { $in: eventIds },
      status: 'paid'
    };

    // Jika withdraw untuk event tertentu
    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event tidak ditemukan' });
      }
      if (event.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Anda tidak memiliki akses untuk event ini' });
      }
      query.event = eventId;
    }

    const orders = await Order.find(query);
    const totalPendapatan = orders.reduce((sum, order) => sum + order.totalHarga, 0);

    const withdrawals = await Withdrawal.find({
      mitra: req.user._id,
      status: 'completed',
      ...(eventId && { event: eventId })
    });

    const totalDitarik = withdrawals.reduce((sum, w) => sum + w.jumlah, 0);

    const withdrawalsPending = await Withdrawal.find({
      mitra: req.user._id,
      status: { $in: ['pending', 'processing'] },
      ...(eventId && { event: eventId })
    });

    const totalPending = withdrawalsPending.reduce((sum, w) => sum + w.jumlah, 0);

    const saldoTersedia = totalPendapatan - totalDitarik - totalPending;

    if (jumlah > saldoTersedia) {
      return res.status(400).json({ 
        message: `Saldo tidak mencukupi. Saldo tersedia: Rp ${saldoTersedia.toLocaleString('id-ID')}` 
      });
    }

    // Hitung admin fee (misalnya 2.5%)
    const adminFee = Math.floor(jumlah * 0.025);
    const jumlahDiterima = jumlah - adminFee;

    const withdrawal = await Withdrawal.create({
      mitra: req.user._id,
      event: eventId || null,
      jumlah,
      bankName,
      accountNumber,
      accountName,
      adminFee,
      jumlahDiterima,
      keterangan: keterangan || ''
    });

    res.status(201).json({
      message: 'Permintaan penarikan dana berhasil diajukan',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel withdrawal (only if pending)
// @route   DELETE /api/withdrawals/:id
// @access  Private/Mitra
const cancelWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Penarikan tidak ditemukan' });
    }

    if (withdrawal.mitra.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Hanya penarikan dengan status pending yang bisa dibatalkan' });
    }

    await withdrawal.deleteOne();

    res.json({ message: 'Penarikan berhasil dibatalkan' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWithdrawals,
  getBalance,
  getEventEarnings,
  createWithdrawal,
  cancelWithdrawal
};
