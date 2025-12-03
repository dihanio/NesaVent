const midtransClient = require('midtrans-client');
const Order = require('../models/Order');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { createNotification } = require('./notificationController');

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// @desc    Create payment transaction
// @route   POST /api/payment/create
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('event');

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    if (!order.event) {
      return res.status(400).json({ message: 'Event tidak ditemukan pada order ini' });
    }

    // Cek apakah order milik user yang login
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Tidak memiliki akses ke order ini' });
    }

    console.log('Order data:', {
      _id: order._id,
      totalHarga: order.totalHarga,
      jumlahTiket: order.jumlahTiket,
      hasItems: !!(order.items && order.items.length > 0),
      itemsCount: order.items ? order.items.length : 0,
      items: order.items
    });

    // Build item_details based on order structure
    let itemDetails = [];
    
    try {
      if (order.items && order.items.length > 0) {
        // New structure: multiple ticket types
        console.log('Processing items structure...');
        itemDetails = order.items.map((item, index) => {
          console.log(`Item ${index}:`, item);
          return {
            id: item.tipeTiket ? item.tipeTiket.toString() : `item-${index}`,
            price: Math.floor(item.hargaSatuan || 0), // Pastikan integer
            quantity: item.jumlah || 1,
            name: `${order.event.nama} - ${item.namaTipe || 'Tiket'}`,
          };
        });
      } else if (order.jumlahTiket && order.totalHarga) {
        // Legacy structure: single ticket type
        console.log('Processing legacy structure...');
        const hargaSatuan = Math.floor(order.totalHarga / order.jumlahTiket);
        itemDetails = [{
          id: order.event._id.toString(),
          price: hargaSatuan,
          quantity: order.jumlahTiket,
          name: order.event.nama,
        }];
      } else {
        // Fallback jika data tidak lengkap
        console.error('Order data tidak lengkap:', JSON.stringify(order, null, 2));
        return res.status(400).json({ message: 'Data order tidak lengkap untuk pembayaran' });
      }
    } catch (itemError) {
      console.error('Error processing items:', itemError);
      return res.status(400).json({ message: 'Gagal memproses data tiket' });
    }

    // Validasi gross_amount = sum of items
    const calculatedTotal = itemDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grossAmount = Math.floor(order.totalHarga);
    
    console.log('Payment validation:', {
      orderTotal: order.totalHarga,
      grossAmount,
      calculatedFromItems: calculatedTotal,
      match: grossAmount === calculatedTotal
    });

    // Adjust jika ada selisih pembulatan
    if (grossAmount !== calculatedTotal) {
      const diff = grossAmount - calculatedTotal;
      if (Math.abs(diff) <= itemDetails.length) {
        // Adjust item pertama
        itemDetails[0].price += diff;
        console.log(`Adjusted item price by ${diff} to match gross_amount`);
      } else {
        console.error('Gross amount mismatch:', { grossAmount, calculatedTotal, diff });
        return res.status(400).json({ 
          message: 'Terjadi kesalahan perhitungan total harga',
          details: { expected: grossAmount, calculated: calculatedTotal }
        });
      }
    }

    // Generate unique order_id dengan timestamp
    const uniqueOrderId = `ORDER-${order._id}-${Date.now()}`;

    // Parameter untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: uniqueOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: order.namaPembeli,
        email: order.emailPembeli,
        phone: order.nomorTelepon,
      },
      item_details: itemDetails,
    };

    console.log('Midtrans parameter:', JSON.stringify(parameter, null, 2));

    // Create transaction
    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
      console.log('Midtrans transaction created successfully:', { 
        token: transaction.token,
        redirect_url: transaction.redirect_url 
      });
    } catch (midtransError) {
      console.error('Midtrans API Error:', midtransError);
      return res.status(500).json({ 
        message: 'Gagal membuat transaksi pembayaran',
        details: midtransError.message 
      });
    }

    // Update order dengan payment info
    order.paymentToken = transaction.token;
    order.paymentUrl = transaction.redirect_url; // Optional, for backup
    await order.save();

    console.log('Order updated with payment token');

    res.json({
      token: transaction.token,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ 
      message: error.message || 'Terjadi kesalahan saat memproses pembayaran' 
    });
  }
};

// @desc    Handle Midtrans notification webhook
// @route   POST /api/payment/notification
// @access  Public (called by Midtrans)
const handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    // Verify notification
    const statusResponse = await snap.transaction.notification(notification);

    // Extract order ID (format: ORDER-{mongoId}-{timestamp})
    const orderIdFull = statusResponse.order_id;
    const orderId = orderIdFull.split('-')[1]; // Get mongoId part
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification untuk order ${orderId}:`, transactionStatus);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    // Update status order berdasarkan status transaksi
    if (transactionStatus == 'capture') {
      if (fraudStatus == 'accept') {
        order.status = 'paid';
        order.paidAt = Date.now();
        order.transactionId = statusResponse.transaction_id;
        await order.save();
        
        // Generate tickets and send notification
        await generateTicketsAndNotify(order);
      }
    } else if (transactionStatus == 'settlement') {
      order.status = 'paid';
      order.paidAt = Date.now();
      order.transactionId = statusResponse.transaction_id;
      await order.save();
      
      // Generate tickets and send notification
      await generateTicketsAndNotify(order);
    } else if (
      transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'
    ) {
      order.status = 'cancelled';
      await order.save();
      
      // Release reserved stock
      await releaseReservedStock(order);
    } else if (transactionStatus == 'pending') {
      order.status = 'pending';
      await order.save();
    }

    res.json({ message: 'Notifikasi berhasil diproses' });
  } catch (error) {
    console.error('Error handling notification:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate tickets and send notifications
const generateTicketsAndNotify = async (order) => {
  try {
    // Populate order data
    await order.populate('event user');
    
    const event = order.event;
    
    // Confirm stock reduction (convert pending to confirmed)
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const ticketType = event.tiketTersedia.id(item.tipeTiket);
        if (ticketType) {
          ticketType.stokPending = Math.max(0, (ticketType.stokPending || 0) - item.jumlah);
        }
      }
      await event.save();
    }
    
    // Generate tickets
    const totalTiket = order.items && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + item.jumlah, 0)
      : order.jumlahTiket;
    
    const tickets = [];
    for (let i = 0; i < totalTiket; i++) {
      const kodeTicket = `TIX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${kodeTicket}`;
      
      const ticket = await Ticket.create({
        order: order._id,
        user: order.user._id,
        event: order.event._id,
        kodeTicket,
        qrCode,
        namaPemilik: order.namaPembeli,
      });
      
      tickets.push(ticket);
    }
    
    // Create notification for event owner (mitra)
    await createNotification(
      event.createdBy,
      'new_order',
      '🎫 Pembelian Tiket Baru!',
      `${order.namaPembeli} membeli ${totalTiket} tiket untuk event "${event.nama}". Total: Rp ${order.totalHarga.toLocaleString('id-ID')}`,
      { relatedOrder: order._id, relatedEvent: event._id }
    );
    
    console.log(`Generated ${tickets.length} tickets for order ${order._id}`);
  } catch (error) {
    console.error('Error generating tickets:', error);
    // Don't throw - we don't want to fail the webhook
  }
};

// Helper function to release reserved stock when payment fails/cancelled
const releaseReservedStock = async (order) => {
  try {
    const event = await Event.findById(order.event);
    
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const ticketType = event.tiketTersedia.id(item.tipeTiket);
        if (ticketType) {
          ticketType.stokTersisa += item.jumlah; // Return stock
          ticketType.stokPending = Math.max(0, (ticketType.stokPending || 0) - item.jumlah); // Remove from pending
        }
      }
      await event.save();
      console.log(`Released stock for cancelled order ${order._id}`);
    }
  } catch (error) {
    console.error('Error releasing stock:', error);
  }
};

module.exports = {
  createPayment,
  handleNotification,
};
