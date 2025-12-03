const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama tipe tiket wajib diisi'],
    trim: true
  },
  harga: {
    type: Number,
    required: [true, 'Harga tiket wajib diisi'],
    min: 0
  },
  stok: {
    type: Number,
    required: [true, 'Stok tiket wajib diisi'],
    min: 0
  },
  stokTersisa: {
    type: Number,
    required: true
  },
  stokPending: {
    type: Number,
    default: 0,
    min: 0
  },
  deskripsi: {
    type: String,
    default: ''
  },
  maxPembelianPerOrang: {
    type: Number,
    default: null, // null = unlimited
    min: 1
  },
  mulaiJual: {
    type: Date,
    default: null // null = langsung tersedia
  },
  akhirJual: {
    type: Date,
    default: null // null = sampai event dimulai
  },
  allowedRoles: {
    type: [String],
    enum: ['user', 'mahasiswa', 'mitra', 'admin'],
    default: ['user', 'mahasiswa', 'mitra', 'admin'] // default: semua role bisa beli
  },
  khususMahasiswa: {
    type: Boolean,
    default: false // Jika true, enforce maxPembelianPerOrang per event untuk role 'user' (mahasiswa)
  }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama event wajib diisi'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  deskripsi: {
    type: String,
    required: [true, 'Deskripsi event wajib diisi']
  },
  tanggal: {
    type: Date,
    required: [true, 'Tanggal event wajib diisi']
  },
  waktu: {
    type: String,
    required: [true, 'Waktu event wajib diisi']
  },
  lokasi: {
    type: String,
    required: [true, 'Lokasi event wajib diisi']
  },
  kategori: {
    type: String,
    enum: ['Musik', 'Olahraga', 'Seminar', 'Workshop', 'Festival', 'Lainnya'],
    default: 'Lainnya'
  },
  tiketTersedia: [{
    type: ticketTypeSchema,
    required: true
  }],
  // Legacy fields untuk backward compatibility
  harga: {
    type: Number,
    min: 0
  },
  stok: {
    type: Number,
    min: 0
  },
  gambar: {
    type: String,
    default: '/images/default-event.jpg'
  },
  penyelenggara: {
    type: String,
    required: [true, 'Penyelenggara wajib diisi']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'aktif', 'selesai', 'dibatalkan', 'ditolak'],
    default: 'draft'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  alasanDitolak: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  }
});

// Virtual untuk total stok semua tipe tiket
eventSchema.virtual('totalStok').get(function () {
  if (this.tiketTersedia && this.tiketTersedia.length > 0) {
    return this.tiketTersedia.reduce((total, tiket) => total + tiket.stok, 0);
  }
  return this.stok || 0;
});

// Virtual untuk total stok tersisa
eventSchema.virtual('totalStokTersisa').get(function () {
  if (this.tiketTersedia && this.tiketTersedia.length > 0) {
    return this.tiketTersedia.reduce((total, tiket) => total + tiket.stokTersisa, 0);
  }
  return this.stok || 0;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
