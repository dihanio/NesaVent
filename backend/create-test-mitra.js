const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB terhubung...');
    } catch (error) {
        console.error('❌ Error koneksi MongoDB:', error.message);
        process.exit(1);
    }
};

const createTestMitra = async () => {
    try {
        // Cek apakah mitra sudah ada
        const existing = await User.findOne({ email: 'hmj-ti@nesavent.com' });

        if (existing) {
            console.log('✅ Mitra HMJ Teknik Informatika sudah ada!');
            console.log('   Slug:', existing.slug);
            console.log('   Email:', existing.email);
            process.exit(0);
            return;
        }

        // Buat mitra baru
        const mitra = await User.create({
            nama: 'Pengurus HMJ Teknik Informatika',
            email: 'hmj-ti@nesavent.com',
            password: 'password123', // Will be hashed by pre-save hook
            nomorTelepon: '081234567890',
            role: 'mitra',
            organisasi: 'HMJ Teknik Informatika'
        });

        console.log('✅ Mitra berhasil dibuat!');
        console.log('   Nama:', mitra.nama);
        console.log('   Email:', mitra.email);
        console.log('   Slug:', mitra.slug);
        console.log('   Password: password123');
        console.log('\n🎉 Akses profil publik di: http://localhost:3000/mitra/' + mitra.slug);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

connectDB().then(() => createTestMitra());
