const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB terhubung dengan sukses');
  } catch (error) {
    console.error('Error koneksi MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
