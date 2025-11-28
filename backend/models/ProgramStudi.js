const mongoose = require('mongoose');

const programStudiSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama program studi wajib diisi'],
    trim: true
  },
  fakultas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fakultas',
    required: [true, 'Fakultas wajib diisi']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index untuk memastikan kombinasi nama dan fakultas unik
programStudiSchema.index({ nama: 1, fakultas: 1 }, { unique: true });

module.exports = mongoose.model('ProgramStudi', programStudiSchema);