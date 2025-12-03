const Event = require('../models/Event');
const cache = require('../utils/cache');

// @desc    Get semua event
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const { kategori, search, sort, page = 1, limit = 0, organizer, lokasi, hargaMin, hargaMax, tanggalMulai, tanggalAkhir } = req.query;
    
    // Create cache key from query params
    const cacheKey = `events:${JSON.stringify(req.query)}`;
    
    // Check cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
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

    // Filter berdasarkan lokasi spesifik
    if (lokasi) {
      query.lokasi = { $regex: lokasi, $options: 'i' };
    }

    // Filter event yang punya tiket khusus mahasiswa
    if (req.query.khususMahasiswa === 'true') {
      query['tiketTersedia.khususMahasiswa'] = true;
    }

    // Filter event gratis (punya minimal 1 tiket dengan harga 0)
    if (req.query.gratis === 'true') {
      query['tiketTersedia.harga'] = 0;
    }

    // Sorting
    let sortOption = { tanggal: 1 }; // Default: Terdekat (Upcoming)

    if (sort === 'newest') {
      sortOption = { createdAt: -1 }; // Terbaru dibuat
    } else if (sort === 'upcoming') {
      sortOption = { tanggal: 1 }; // Terdekat
      // Only apply upcoming filter if no custom date range is set
      if (!tanggalMulai && !tanggalAkhir) {
        query.tanggal = { $gte: new Date() }; // Hanya yang belum lewat
      }
    } else if (sort === 'popular') {
      sortOption = { views: -1 }; // Terbanyak dilihat
    } else if (sort === 'price-low' || sort === 'price-high') {
      // For price sorting, we'll fetch all events first and sort in memory
      // This is a workaround since we need to calculate min price from tiketTersedia array
    }

    // Filter berdasarkan rentang tanggal (applied after sorting logic to avoid conflicts)
    if (tanggalMulai || tanggalAkhir) {
      query.tanggal = query.tanggal || {};
      if (tanggalMulai) {
        query.tanggal.$gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        const endDate = new Date(tanggalAkhir);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        query.tanggal.$lte = endDate;
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let events;
    let total;

    // Need to process events in memory if we have price filters or price sorting
    const needsMemoryProcessing = sort === 'price-low' || sort === 'price-high' || hargaMin || hargaMax;

    if (needsMemoryProcessing) {
      // Fetch all matching events
      const allEvents = await Event.find(query);
      
      // Calculate min price for each event and filter by price range
      let eventsWithPrice = allEvents.map(event => {
        const eventObj = event.toObject();
        let minPrice = 0;
        
        // Get minimum price from tiketTersedia or use harga field
        if (eventObj.tiketTersedia && eventObj.tiketTersedia.length > 0) {
          const prices = eventObj.tiketTersedia.map(t => t.harga || 0);
          minPrice = Math.min(...prices);
        } else if (eventObj.harga !== undefined && eventObj.harga !== null) {
          minPrice = eventObj.harga;
        }
        
        eventObj.minHarga = minPrice;
        return eventObj;
      });

      // Filter by price range
      if (hargaMin) {
        const minPrice = parseFloat(hargaMin);
        eventsWithPrice = eventsWithPrice.filter(e => e.minHarga >= minPrice);
      }
      if (hargaMax) {
        const maxPrice = parseFloat(hargaMax);
        eventsWithPrice = eventsWithPrice.filter(e => e.minHarga <= maxPrice);
      }

      // Sort by price if needed
      if (sort === 'price-low' || sort === 'price-high') {
        eventsWithPrice.sort((a, b) => {
          const priceA = Number(a.minHarga) || 0;
          const priceB = Number(b.minHarga) || 0;
          
          if (sort === 'price-low') {
            return priceA - priceB;
          } else {
            return priceB - priceA;
          }
        });
      }

      // Apply pagination
      total = eventsWithPrice.length;
      if (limitNum > 0) {
        events = eventsWithPrice.slice(skip, skip + limitNum);
      } else {
        events = eventsWithPrice;
      }
    } else {
      // Standard sorting with database query
      let eventsQuery = Event.find(query).sort(sortOption);

      if (limitNum > 0) {
        eventsQuery = eventsQuery.skip(skip).limit(limitNum);
      }

      events = await eventsQuery;
      total = await Event.countDocuments(query);
    }

    const result = {
      data: events,
      pagination: limitNum > 0 ? {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + events.length < total
      } : null
    };
    
    // Cache the result for 2 minutes
    await cache.set(cacheKey, result, 120);
    
    res.json(result);
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

    // Increment views with anti-spam protection
    // Create unique view key based on event ID and IP/User
    const viewerIdentifier = req.user?._id || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const viewKey = `event:view:${event._id}:${viewerIdentifier}`;
    
    // Check if this viewer has already viewed this event recently (within 1 hour)
    const hasViewedRecently = await cache.get(viewKey);
    
    if (!hasViewedRecently) {
      // Increment view count
      await eventsCollection.updateOne(
        { _id: event._id },
        { $inc: { views: 1 } }
      );
      event.views = (event.views || 0) + 1;
      
      // Set cooldown for 1 hour (3600 seconds)
      await cache.set(viewKey, 'viewed', 3600);
    } else {
      // User already viewed recently, don't increment
      event.views = event.views || 0;
    }

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
    
    // Invalidate events cache
    await cache.invalidatePattern('events:');

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
