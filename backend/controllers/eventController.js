const Event = require('../models/Event');

// @desc    Get semua event
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const { kategori, search } = req.query;
    let query = { status: 'aktif' };

    // Filter berdasarkan kategori
    if (kategori && kategori !== 'Semua') {
      query.kategori = kategori;
    }

    // Search berdasarkan nama atau lokasi
    if (search) {
      query.$or = [
        { nama: { $regex: search, $options: 'i' } },
        { lokasi: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query).sort({ tanggal: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detail event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ message: 'Event tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buat event baru
// @route   POST /api/events
// @access  Private (untuk admin/organizer)
const createEvent = async (req, res) => {
  try {
    const {
      nama,
      deskripsi,
      tanggal,
      waktu,
      lokasi,
      kategori,
      tiketTersedia,
      gambar,
    } = req.body;

    // Otomatis set penyelenggara dari user yang login
    const penyelenggara = req.user.organisasi || req.user.nama;

    // Validasi tiket tersedia
    if (!tiketTersedia || tiketTersedia.length === 0) {
      return res.status(400).json({ message: 'Minimal harus ada 1 tipe tiket' });
    }

    // Set stokTersisa sama dengan stok untuk setiap tipe tiket
    const tiketWithStok = tiketTersedia.map(tiket => ({
      ...tiket,
      stokTersisa: tiket.stok
    }));

    // Tentukan status berdasarkan role user
    let status = 'draft';
    let isVerified = false;
    
    // Jika admin yang buat, langsung aktif
    if (req.user.role === 'admin') {
      status = 'aktif';
      isVerified = true;
    }

    const event = await Event.create({
      nama,
      deskripsi,
      tanggal,
      waktu,
      lokasi,
      kategori,
      tiketTersedia: tiketWithStok,
      gambar,
      penyelenggara,
      status,
      isVerified,
      createdBy: req.user._id,
      verifiedBy: req.user.role === 'admin' ? req.user._id : null,
      verifiedAt: req.user.role === 'admin' ? Date.now() : null,
    });

    res.status(201).json({
      event,
      message: req.user.role === 'admin' 
        ? 'Event berhasil dibuat dan dipublikasikan' 
        : 'Event berhasil dibuat sebagai draft. Silakan ajukan untuk verifikasi admin.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      Object.assign(event, req.body);
      const updatedEvent = await event.save();
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Event tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hapus event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      await event.deleteOne();
      res.json({ message: 'Event berhasil dihapus' });
    } else {
      res.status(404).json({ message: 'Event tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
