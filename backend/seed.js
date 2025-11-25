const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Event = require('./models/Event');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB terhubung untuk seeding...');
  } catch (error) {
    console.error('Error koneksi MongoDB:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Hapus users yang sudah ada untuk re-seed
    await User.deleteMany({
      email: { $in: ['admin@nesavent.com', 'mitra@nesavent.com', 'user@nesavent.com'] }
    });

    // Tidak perlu hash manual, biarkan model User.js yang handle
    const users = [
      {
        nama: 'Admin NESAVENT',
        email: 'admin@nesavent.com',
        password: 'password123',
        nomorTelepon: '081234567890',
        role: 'admin',
        organisasi: 'NESAVENT Platform',
      },
      {
        nama: 'Mitra Event Organizer',
        email: 'mitra@nesavent.com',
        password: 'password123',
        nomorTelepon: '081234567891',
        role: 'mitra',
        organisasi: 'Event Organizer Indonesia',
      },
      {
        nama: 'User Biasa',
        email: 'user@nesavent.com',
        password: 'password123',
        nomorTelepon: '081234567892',
        role: 'user',
      },
    ];

    for (const userData of users) {
      await User.create(userData);
      console.log(`✅ User ${userData.nama} (${userData.role}) berhasil dibuat`);
    }

    console.log('\n🎉 Users seeding selesai!');
  } catch (error) {
    console.error('Error saat seeding users:', error);
    throw error;
  }
};

const seedEvents = async () => {
  try {
    // Hapus events yang sudah ada untuk re-seed
    await Event.deleteMany({});

    const events = [
      {
        nama: 'Konser Musik Jazz Under The Stars',
        deskripsi: 'Nikmati malam yang indah dengan alunan musik jazz dari musisi ternama. Event ini akan menghadirkan berbagai penampilan dari musisi jazz internasional dan lokal.',
        tanggal: new Date('2025-02-15'),
        waktu: '19:00',
        lokasi: 'Jakarta Convention Center',
        kategori: 'Musik',
        tiketTersedia: [
          {
            nama: 'Early Bird',
            harga: 150000,
            stok: 100,
            stokTersisa: 100,
            deskripsi: 'Harga spesial untuk pembeli awal'
          },
          {
            nama: 'Regular',
            harga: 250000,
            stok: 200,
            stokTersisa: 200,
            deskripsi: 'Tiket standar'
          },
          {
            nama: 'VIP',
            harga: 500000,
            stok: 50,
            stokTersisa: 50,
            deskripsi: 'Akses VIP Lounge + Meet & Greet'
          }
        ],
        gambar: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c',
        penyelenggara: 'Event Organizer Indonesia',
        status: 'aktif'
      },
      {
        nama: 'Workshop Digital Marketing 2025',
        deskripsi: 'Pelajari strategi digital marketing terbaru dari para ahli. Workshop ini akan membahas SEO, Social Media Marketing, Content Marketing, dan Analytics.',
        tanggal: new Date('2025-02-20'),
        waktu: '09:00',
        lokasi: 'Grand Ballroom Hotel Mulia, Jakarta',
        kategori: 'Workshop',
        tiketTersedia: [
          {
            nama: 'Student',
            harga: 100000,
            stok: 50,
            stokTersisa: 50,
            deskripsi: 'Khusus pelajar/mahasiswa (bawa kartu pelajar)'
          },
          {
            nama: 'Professional',
            harga: 300000,
            stok: 100,
            stokTersisa: 100,
            deskripsi: 'Untuk umum + sertifikat + e-book'
          }
        ],
        gambar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        penyelenggara: 'Event Organizer Indonesia',
        status: 'aktif'
      },
      {
        nama: 'Fun Run & Color Festival',
        deskripsi: 'Acara lari santai 5K dengan festival warna yang seru! Cocok untuk keluarga dan teman-teman. Dapatkan kaos, medali, dan snack box.',
        tanggal: new Date('2025-03-10'),
        waktu: '06:00',
        lokasi: 'Gelora Bung Karno, Jakarta',
        kategori: 'Olahraga',
        tiketTersedia: [
          {
            nama: 'Single Runner',
            harga: 125000,
            stok: 500,
            stokTersisa: 500,
            deskripsi: 'Tiket per orang (kaos + medali + snack)'
          },
          {
            nama: 'Family Package (4 pax)',
            harga: 400000,
            stok: 100,
            stokTersisa: 100,
            deskripsi: 'Paket hemat untuk 4 orang'
          }
        ],
        gambar: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3',
        penyelenggara: 'Event Organizer Indonesia',
        status: 'aktif'
      }
    ];

    for (const eventData of events) {
      await Event.create(eventData);
      console.log(`✅ Event "${eventData.nama}" berhasil dibuat`);
    }

    console.log('\n🎉 Events seeding selesai!');
  } catch (error) {
    console.error('Error saat seeding events:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    await seedUsers();
    await seedEvents();

    console.log('\n======================================');
    console.log('🎉 SEEDING LENGKAP!');
    console.log('======================================');
    console.log('\nAkun yang tersedia:');
    console.log('-------------------------------------');
    console.log('ADMIN:');
    console.log('  Email: admin@nesavent.com');
    console.log('  Password: password123');
    console.log('\nMITRA:');
    console.log('  Email: mitra@nesavent.com');
    console.log('  Password: password123');
    console.log('\nUSER:');
    console.log('  Email: user@nesavent.com');
    console.log('  Password: password123');
    console.log('======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error saat seeding:', error);
    process.exit(1);
  }
};

connectDB().then(() => runSeed());
