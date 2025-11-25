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
      jumlahTiket,
      namaPembeli,
      emailPembeli,
      nomorTelepon,
      ticketTypeId,
    } = req.body;

    console.log('Create order request:', { eventId, jumlahTiket, ticketTypeId });

    // Cek event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    let hargaSatuan;
    let ticketType = null;
    let items = [];

    // Jika ada multiple ticket types
    if (event.tiketTersedia && event.tiketTersedia.length > 0) {
      if (!ticketTypeId) {
        return res.status(400).json({ message: 'Silakan pilih tipe tiket' });
      }

      ticketType = event.tiketTersedia.id(ticketTypeId);
      
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

      hargaSatuan = ticketType.harga;
      
      // Buat item untuk order
      items = [{
        tipeTiket: ticketType._id,
        namaTipe: ticketType.nama,
        hargaSatuan: ticketType.harga,
        jumlah: jumlahTiket,
        subtotal: ticketType.harga * jumlahTiket
      }];
    } else {
      // Legacy: single ticket type
      if (event.stok < jumlahTiket) {
        return res.status(400).json({ message: 'Stok tiket tidak mencukupi' });
      }
      hargaSatuan = event.harga || 0;
    }

    // Hitung total harga
    const totalHarga = hargaSatuan * jumlahTiket;

    console.log('Order calculation:', { hargaSatuan, jumlahTiket, totalHarga, hasItems: items.length > 0 });

    // Buat order
    const orderData = {
      user: req.user._id,
      event: eventId,
      jumlahTiket, // Legacy field
      totalHarga,
      namaPembeli,
      emailPembeli,
      nomorTelepon,
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

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
};
