const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  mitra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false // Null jika penarikan untuk semua event
  },
  jumlah: {
    type: Number,
    required: [true, 'Jumlah penarikan wajib diisi'],
    min: 10000 // Minimal Rp 10.000
  },
  bankName: {
    type: String,
    required: [true, 'Nama bank wajib diisi']
  },
  accountNumber: {
    type: String,
    required: [true, 'Nomor rekening wajib diisi']
  },
  accountName: {
    type: String,
    required: [true, 'Nama pemilik rekening wajib diisi']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  adminFee: {
    type: Number,
    default: 0
  },
  jumlahDiterima: {
    type: Number,
    required: true
  },
  keterangan: {
    type: String,
    default: ''
  },
  alasanDitolak: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
