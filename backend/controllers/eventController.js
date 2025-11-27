const Event = require('../models/Event');

// @desc    Get semua event
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const { kategori, search, sort, page = 1, limit = 0, organizer } = req.query;
    let query = { status: 'aktif' };

    // Filter berdasarkan organizer (createdBy)
    if (organizer) {
      query.createdBy = organizer;
    }

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

    // Sorting
    let sortOption = { tanggal: 1 }; // Default: Terdekat (Upcoming)

    if (sort === 'newest') {
      sortOption = { createdAt: -1 }; // Terbaru dibuat
    } else if (sort === 'upcoming') {
      sortOption = { tanggal: 1 }; // Terdekat
      query.tanggal = { $gte: new Date() }; // Hanya yang belum lewat
    } else if (sort === 'popular') {
      sortOption = { views: -1 }; // Terbanyak dilihat
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let eventsQuery = Event.find(query).sort(sortOption);

    if (limitNum > 0) {
      eventsQuery = eventsQuery.skip(skip).limit(limitNum);
    }

    const events = await eventsQuery;

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    res.json({
      data: events,
      pagination: limitNum > 0 ? {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + events.length < total
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detail event
// @route   GET /api/events/:slug
// @access  Public
const getEventById = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Requested slug:', slug);

    // Use raw MongoDB query to avoid any Mongoose issues
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const eventsCollection = db.collection('events');

    const event = await eventsCollection.findOne({ slug: slug });
    console.log('Raw query result:', event ? 'found' : 'not found');

    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    // Populate createdBy manually
    if (event.createdBy) {
      const usersCollection = db.collection('users');
      const creator = await usersCollection.findOne(
        { _id: new mongoose.Types.ObjectId(event.createdBy) },
        { nama: 1, organisasi: 1, avatar: 1, slug: 1 }
      );
      if (creator) {
        event.createdBy = creator;
      }
    }

    // Increment views
    await eventsCollection.updateOne(
      { _id: event._id },
      { $inc: { views: 1 } }
    );
    event.views = (event.views || 0) + 1;

    res.json(event);
  } catch (error) {
    console.error('Error in getEventById:', error);
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

    // Generate slug
    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    let baseSlug = slugify(nama);
    let slug = baseSlug;
    let counter = 1;

    while (await Event.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

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
      slug,
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
// @route   PUT /api/events/:slug
// @access  Private
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });

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
// @route   DELETE /api/events/:slug
// @access  Private
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });

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

// @desc    Get events by partner slug
// @route   GET /api/events/partner/:partnerSlug
// @access  Public
const getEventsByPartnerId = async (req, res) => {
  try {
    const { partnerSlug } = req.params;
    const { page = 1, limit = 0 } = req.query;
    
    // Find partner by slug
    const User = require('../models/User');
    const partner = await User.findOne({ slug: partnerSlug });
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner tidak ditemukan' });
    }
    
    if (partner.role !== 'mitra' && partner.role !== 'admin') {
      return res.status(400).json({ message: 'User bukan partner' });
    }
    
    // Build query
    let query = {
      createdBy: partner._id,
      status: 'aktif'
    };
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    let eventsQuery = Event.find(query).sort({ createdAt: -1 });
    
    if (limitNum > 0) {
      eventsQuery = eventsQuery.skip(skip).limit(limitNum);
    }
    
    const events = await eventsQuery;
    
    // Get total count for pagination
    const total = await Event.countDocuments(query);
    
    res.json({
      partner: {
        _id: partner._id,
        nama: partner.nama,
        organisasi: partner.organisasi,
        email: partner.email,
        slug: partner.slug
      },
      data: events,
      pagination: limitNum > 0 ? {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + events.length < total
      } : null
    });
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
  getEventsByPartnerId,
};
