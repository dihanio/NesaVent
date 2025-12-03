const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  tipeTiket: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  namaTipe: {
    type: String,
    required: true
  },
  hargaSatuan: {
    type: Number,
    required: true
  },
  jumlah: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  items: [{
    type: orderItemSchema
  }],
  // Legacy field untuk backward compatibility
  jumlahTiket: {
    type: Number,
    min: 1
  },
  totalHarga: {
    type: Number,
    required: true
  },
  namaPembeli: {
    type: String,
    required: false // Made optional for initial order creation
  },
  emailPembeli: {
    type: String,
    required: false // Made optional for initial order creation
  },
  nomorTelepon: {
    type: String,
    required: false // Made optional for initial order creation
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'expired', 'cancelled'],
    default: 'pending'
  },
  paymentToken: {
    type: String
  },
  paymentUrl: {
    type: String
  },
  transactionId: {
    type: String
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual untuk total jumlah tiket dari semua items
orderSchema.virtual('totalJumlahTiket').get(function() {
  if (this.items && this.items.length > 0) {
    return this.items.reduce((total, item) => total + item.jumlah, 0);
  }
  return this.jumlahTiket || 0;
});

// Indexes for query optimization
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ event: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: 1 }); // For expiry job
orderSchema.index({ transactionId: 1 });

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
