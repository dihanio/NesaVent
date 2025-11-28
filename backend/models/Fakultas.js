const mongoose = require('mongoose');

const fakultasSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama fakultas wajib diisi'],
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Fakultas', fakultasSchema);