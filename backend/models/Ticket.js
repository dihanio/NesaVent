const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
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
  kodeTicket: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true
  },
  namaPemilik: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['aktif', 'terpakai', 'expired'],
    default: 'aktif'
  },
  divalidasiPada: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
