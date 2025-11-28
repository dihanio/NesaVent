const Order = require('../models/Order');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { createNotification } = require('./notificationController');

// @desc    Get all orders for mitra
// @route   GET /api/orders
// @access  Private (Mitra/Admin)
const getAllOrders = async (req, res) => {
  try {
    let query = {};

    // If user is mitra, only show orders for their events
    if (req.user.role === 'mitra') {
      const mitraEvents = await Event.find({ createdBy: req.user._id }).select('_id');
      const eventIds = mitraEvents.map(event => event._id);
      query.event = { $in: eventIds };
    }

    const orders = await Order.find(query)
      .populate('event', 'nama tanggalMulai lokasi')
      .populate('user', 'nama email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buat order baru
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      eventId,
      ticketSelections, // New format: array of { ticketTypeId, quantity }
      jumlahTiket, // Legacy support
      namaPembeli,
      emailPembeli,
      nomorTelepon,
      ticketTypeId, // Legacy support
    } = req.body;

    console.log('Create order request:', { eventId, ticketSelections, ticketTypeId, jumlahTiket });

    // Cek event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    let totalHarga = 0;
    let items = [];
    let totalQuantity = 0;

    // Handle new format with ticketSelections
    if (ticketSelections && Array.isArray(ticketSelections) && ticketSelections.length > 0) {
      for (const selection of ticketSelections) {
        const { ticketTypeId, quantity } = selection;

        if (!ticketTypeId || !quantity || quantity <= 0) {
          return res.status(400).json({ message: 'Data tiket tidak valid' });
        }

        const ticketType = event.tiketTersedia.id(ticketTypeId);

        if (!ticketType) {
          return res.status(404).json({ message: 'Tipe tiket tidak ditemukan' });
        }

        // Cek periode penjualan
        const now = new Date();
        if (ticketType.mulaiJual && new Date(ticketType.mulaiJual) > now) {
          return res.status(400).json({ message: 'Penjualan tiket belum dimulai' });
        }
        if (ticketType.akhirJual && new Date(ticketType.akhirJual) < now) {
          return res.status(400).json({ message: 'Penjualan tiket sudah berakhir' });
        }

        // Cek apakah role user diizinkan untuk membeli tiket ini
        if (ticketType.allowedRoles && ticketType.allowedRoles.length > 0) {
          if (!ticketType.allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
              message: `Tiket ${ticketType.nama} hanya dapat dibeli oleh ${ticketType.allowedRoles.join(', ')}`
            });
          }
        }

        // Cek stok tiket tipe ini
        if (ticketType.stokTersisa < quantity) {
          return res.status(400).json({ message: `Stok tiket ${ticketType.nama} tidak mencukupi` });
        }

        // Cek maksimal pembelian per orang (untuk semua role)
        if (ticketType.maxPembelianPerOrang) {
          const existingOrders = await Order.find({
            user: req.user._id,
            event: eventId,
            'items.tipeTiket': ticketTypeId,
            status: { $in: ['pending', 'paid'] }
          });

          const totalPurchased = existingOrders.reduce((sum, order) => {
            const item = order.items.find(i => i.tipeTiket.toString() === ticketTypeId);
            return sum + (item ? item.jumlah : 0);
          }, 0);

          if (totalPurchased + quantity > ticketType.maxPembelianPerOrang) {
            return res.status(400).json({
              message: `Maksimal pembelian ${ticketType.maxPembelianPerOrang} tiket ${ticketType.nama} per orang. Anda sudah membeli ${totalPurchased} tiket.`
            });
          }
        }

        // Validasi khusus untuk tiket mahasiswa - enforce maxPembelianPerOrang wajib
        if (ticketType.khususMahasiswa && req.user.role === 'user') {
          // Cek apakah user sudah terverifikasi sebagai mahasiswa
          if (req.user.studentVerificationStatus !== 'approved') {
            return res.status(403).json({
              message: 'Tiket ini khusus untuk mahasiswa terverifikasi. Silakan lengkapi profil mahasiswa Anda (NIM, Program Studi, Fakultas, dan upload KTM) dan tunggu verifikasi dari admin untuk dapat membeli tiket mahasiswa.'
            });
          }

          // Jika tiket khusus mahasiswa, pastikan ada batas maksimal
          if (!ticketType.maxPembelianPerOrang) {
            return res.status(400).json({
              message: `Tiket ${ticketType.nama} memerlukan pengaturan maksimal pembelian.`
            });
          }

          // Cek total pembelian untuk event ini (bukan per tipe tiket, tapi per event)
          const existingEventOrders = await Order.find({
            user: req.user._id,
            event: eventId,
            status: { $in: ['pending', 'paid'] }
          });

          if (existingEventOrders.length > 0) {
            const totalEventTickets = existingEventOrders.reduce((sum, order) => {
              return sum + (order.items && order.items.length > 0
                ? order.items.reduce((itemSum, item) => itemSum + item.jumlah, 0)
                : order.jumlahTiket || 0);
            }, 0);

            if (totalEventTickets >= ticketType.maxPembelianPerOrang) {
              return res.status(400).json({
                message: `Akun mahasiswa dibatasi maksimal ${ticketType.maxPembelianPerOrang} tiket untuk event ini. Anda sudah membeli ${totalEventTickets} tiket.`
              });
            }

            // Cek apakah pembelian sekarang + yang sudah ada melebihi batas
            if (totalEventTickets + quantity > ticketType.maxPembelianPerOrang) {
              const remaining = ticketType.maxPembelianPerOrang - totalEventTickets;
              return res.status(400).json({
                message: `Anda hanya bisa membeli ${remaining} tiket lagi untuk event ini (maksimal ${ticketType.maxPembelianPerOrang} tiket per mahasiswa).`
              });
            }
          }
        }

        // Buat item untuk order
        items.push({
          tipeTiket: ticketType._id,
          namaTipe: ticketType.nama,
          hargaSatuan: ticketType.harga,
          jumlah: quantity,
          subtotal: ticketType.harga * quantity
        });

        totalHarga += ticketType.harga * quantity;
        totalQuantity += quantity;
      }
    } else {
      // Legacy support for single ticket type
      if (!ticketTypeId && !jumlahTiket) {
        return res.status(400).json({ message: 'Silakan pilih tipe tiket atau jumlah tiket' });
      }

      if (ticketTypeId) {
        // Single ticket type (legacy)
        const ticketType = event.tiketTersedia.id(ticketTypeId);

        if (!ticketType) {
          return res.status(404).json({ message: 'Tipe tiket tidak ditemukan' });
        }

        // Cek periode penjualan
        const now = new Date();
        if (ticketType.mulaiJual && new Date(ticketType.mulaiJual) > now) {
          return res.status(400).json({ message: 'Penjualan tiket belum dimulai' });
        }
        if (ticketType.akhirJual && new Date(ticketType.akhirJual) < now) {
          return res.status(400).json({ message: 'Penjualan tiket sudah berakhir' });
        }

        // Cek apakah role user diizinkan untuk membeli tiket ini
        if (ticketType.allowedRoles && ticketType.allowedRoles.length > 0) {
          if (!ticketType.allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
              message: `Tiket ${ticketType.nama} hanya dapat dibeli oleh ${ticketType.allowedRoles.join(', ')}`
            });
          }
        }

        // Cek stok tiket tipe ini
        if (ticketType.stokTersisa < jumlahTiket) {
          return res.status(400).json({ message: 'Stok tiket tidak mencukupi' });
        }

        // Cek maksimal pembelian per orang
        if (ticketType.maxPembelianPerOrang) {
          const existingOrders = await Order.find({
            user: req.user._id,
            event: eventId,
            'items.tipeTiket': ticketTypeId,
            status: { $in: ['pending', 'paid'] }
          });

          const totalPurchased = existingOrders.reduce((sum, order) => {
            const item = order.items.find(i => i.tipeTiket.toString() === ticketTypeId);
            return sum + (item ? item.jumlah : 0);
          }, 0);

          if (totalPurchased + jumlahTiket > ticketType.maxPembelianPerOrang) {
            return res.status(400).json({
              message: `Maksimal pembelian ${ticketType.maxPembelianPerOrang} tiket per orang. Anda sudah membeli ${totalPurchased} tiket.`
            });
          }
        }

        // Validasi khusus untuk tiket mahasiswa (legacy)
        if (ticketType.khususMahasiswa && req.user.role === 'user') {
          // Cek apakah user sudah terverifikasi sebagai mahasiswa
          if (!req.user.isStudentVerified) {
            return res.status(403).json({
              message: 'Tiket ini khusus untuk mahasiswa terverifikasi. Silakan lengkapi profil mahasiswa Anda (NIM, Program Studi, Fakultas, dan upload KTM) untuk dapat membeli tiket mahasiswa.'
            });
          }

          // Jika tiket khusus mahasiswa, pastikan ada batas maksimal
          if (!ticketType.maxPembelianPerOrang) {
            return res.status(400).json({
              message: `Tiket ${ticketType.nama} memerlukan pengaturan maksimal pembelian.`
            });
          }

          // Cek total pembelian untuk event ini
          const existingEventOrders = await Order.find({
            user: req.user._id,
            event: eventId,
            status: { $in: ['pending', 'paid'] }
          });

          if (existingEventOrders.length > 0) {
            const totalEventTickets = existingEventOrders.reduce((sum, order) => {
              return sum + (order.items && order.items.length > 0
                ? order.items.reduce((itemSum, item) => itemSum + item.jumlah, 0)
                : order.jumlahTiket || 0);
            }, 0);

            if (totalEventTickets >= ticketType.maxPembelianPerOrang) {
              return res.status(400).json({
                message: `Akun mahasiswa dibatasi maksimal ${ticketType.maxPembelianPerOrang} tiket untuk event ini. Anda sudah membeli ${totalEventTickets} tiket.`
              });
            }

            if (totalEventTickets + jumlahTiket > ticketType.maxPembelianPerOrang) {
              const remaining = ticketType.maxPembelianPerOrang - totalEventTickets;
              return res.status(400).json({
                message: `Anda hanya bisa membeli ${remaining} tiket lagi untuk event ini (maksimal ${ticketType.maxPembelianPerOrang} tiket per mahasiswa).`
              });
            }
          }
        }

        totalHarga = ticketType.harga * jumlahTiket;
        totalQuantity = jumlahTiket;

        // Buat item untuk order
        items = [{
          tipeTiket: ticketType._id,
          namaTipe: ticketType.nama,
          hargaSatuan: ticketType.harga,
          jumlah: jumlahTiket,
          subtotal: ticketType.harga * jumlahTiket
        }];
      } else {
        // Legacy: single ticket type without ticketTypeId
        if (event.stok < jumlahTiket) {
          return res.status(400).json({ message: 'Stok tiket tidak mencukupi' });
        }
        totalHarga = event.harga || 0 * jumlahTiket;
        totalQuantity = jumlahTiket;
      }
    }

    console.log('Order calculation:', { totalHarga, totalQuantity, hasItems: items.length > 0 });

    // Buat order
    const orderData = {
      user: req.user._id,
      event: eventId,
      jumlahTiket: totalQuantity, // Legacy field
      totalHarga,
    };

    // Tambahkan items jika ada
    if (items.length > 0) {
      orderData.items = items;
    }

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);

    // Populate data
    await order.populate('event');

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order user
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('event')
      .populate('user', 'nama email');

    if (order) {
      // Cek apakah order milik user yang login
      if (order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Tidak memiliki akses ke order ini' });
      }

      res.json(order);
    } else {
      res.status(404).json({ message: 'Order tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update status order menjadi paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = 'paid';
      order.paidAt = Date.now();
      order.transactionId = req.body.transactionId;

      const updatedOrder = await order.save();

      // Kurangi stok event
      const event = await Event.findById(order.event);

      // Update stok berdasarkan items atau legacy field
      if (order.items && order.items.length > 0) {
        // Update stok untuk setiap ticket type
        for (const item of order.items) {
          const ticketType = event.tiketTersedia.id(item.tipeTiket);
          if (ticketType) {
            ticketType.stokTersisa -= item.jumlah;
          }
        }
        await event.save();
      } else if (order.jumlahTiket) {
        // Legacy: update stok event langsung
        if (event.stok !== undefined) {
          event.stok -= order.jumlahTiket;
          await event.save();
        }
      }

      // Create notification for event owner (mitra)
      const totalTiket = order.items && order.items.length > 0
        ? order.items.reduce((sum, item) => sum + item.jumlah, 0)
        : order.jumlahTiket;

      await createNotification(
        event.createdBy,
        'new_order',
        '🎫 Pembelian Tiket Baru!',
        `${order.namaPembeli} membeli ${totalTiket} tiket untuk event "${event.nama}". Total: Rp ${order.totalHarga.toLocaleString('id-ID')}`,
        { relatedOrder: order._id, relatedEvent: event._id }
      );

      // Generate tiket
      const tickets = [];
      const jumlahTiketTotal = totalTiket;

      for (let i = 0; i < jumlahTiketTotal; i++) {
        const kodeTicket = `TIX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${kodeTicket}`;

        const ticket = await Ticket.create({
          order: order._id,
          user: order.user,
          event: order.event,
          kodeTicket,
          qrCode,
          namaPemilik: order.namaPembeli,
        });

        tickets.push(ticket);
      }

      res.json({ order: updatedOrder, tickets });
    } else {
      res.status(404).json({ message: 'Order tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order buyer details
// @route   PUT /api/orders/:id
// @access  Private
const updateOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    // Check if order belongs to current user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Tidak memiliki akses ke order ini' });
    }

    // Only allow updates for pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order tidak dapat diubah' });
    }

    const { namaPembeli, emailPembeli, nomorTelepon } = req.body;

    // Update buyer details
    if (namaPembeli !== undefined) order.namaPembeli = namaPembeli;
    if (emailPembeli !== undefined) order.emailPembeli = emailPembeli;
    if (nomorTelepon !== undefined) order.nomorTelepon = nomorTelepon;

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderDetails,
};
