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
    required: [true, 'Nama pembeli wajib diisi']
  },
  emailPembeli: {
    type: String,
    required: [true, 'Email pembeli wajib diisi']
  },
  nomorTelepon: {
    type: String,
    required: [true, 'Nomor telepon wajib diisi']
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

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
