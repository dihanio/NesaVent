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

// Generate random date between start and end
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random number between min and max
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Event categories
const categories = ['Musik', 'Olahraga', 'Seminar', 'Workshop', 'Festival', 'Lainnya'];

// Indonesian cities for locations - focus on Surabaya and nearby areas
const cities = [
  'Surabaya', 'Kampus UNESA Lidah Wetan', 'Kampus UNESA Ketintang',
  'Kampus UNESA Lidah Kulon', 'Auditorium UNESA', 'Gedung Serbaguna UNESA',
  'Stadion UNESA', 'Taman Kampus UNESA'
];

// Venues - UNESA specific venues
const venues = [
  'Auditorium Prof. Dr. H. Soetomo', 'Gedung Serbaguna', 'Stadion UNESA',
  'Teater Kampus', 'Lapangan Basket UNESA', 'Aula Fakultas', 'Perpustakaan UNESA',
  'Taman Kampus', 'Gedung Rektorat', 'Masjid Kampus', 'Kantin UNESA'
];

// Event organizers - UNESA organizations
const organizers = [
  'BEM UNESA', 'UKM Seni UNESA', 'UKM Olahraga UNESA', 'HMJ Teknik UNESA',
  'HMJ Ekonomi UNESA', 'HMJ Hukum UNESA', 'HMJ Kedokteran UNESA',
  'UKM Musik UNESA', 'UKM Tari UNESA', 'UKM Teater UNESA', 'UKM Fotografi UNESA',
  'Lembaga Pers Mahasiswa', 'KSR PMI Unit UNESA', 'Pramuka UNESA'
];

// Unsplash images for different event categories
const unsplashImages = {
  Musik: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
  ],
  Olahraga: [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop'
  ],
  Seminar: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop'
  ],
  Workshop: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop'
  ],
  Festival: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
  ],
  Lainnya: [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop'
  ]
};

// Event templates - UNESA campus events
const eventTemplates = [
  // Academic Events
  {
    nama: 'Seminar Nasional Teknologi Informasi',
    deskripsi: 'Seminar nasional yang menghadirkan pembicara ahli di bidang teknologi informasi. Diskusi mendalam tentang tren digital terkini.',
    kategori: 'Seminar',
    tiketTersedia: [
      { nama: 'Mahasiswa UNESA', harga: 25000, stok: 200, deskripsi: 'Khusus mahasiswa UNESA' },
      { nama: 'Umum', harga: 50000, stok: 100, deskripsi: 'Mahasiswa luar + umum' },
      { nama: 'VIP', harga: 100000, stok: 50, deskripsi: 'VIP + networking + sertifikat' }
    ]
  },
  {
    nama: 'Workshop Kewirausahaan Mahasiswa',
    deskripsi: 'Workshop praktis tentang kewirausahaan untuk mahasiswa. Belajar membuat business plan dan pitching kepada investor.',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Peserta Workshop', harga: 30000, stok: 150, deskripsi: 'Workshop + materi + sertifikat' },
      { nama: 'Premium', harga: 75000, stok: 30, deskripsi: 'Premium + mentoring + networking' }
    ]
  },
  {
    nama: 'Lomba Karya Tulis Ilmiah',
    deskripsi: 'Kompetisi karya tulis ilmiah antar mahasiswa UNESA. Tema terkini dan relevan dengan perkembangan zaman.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Peserta Lomba', harga: 15000, stok: 100, deskripsi: 'Biaya pendaftaran lomba' }
    ]
  },

  // Arts & Culture Events
  {
    nama: 'Festival Seni UNESA',
    deskripsi: 'Festival seni tahunan UNESA yang menampilkan berbagai pertunjukan seni dari mahasiswa berbakat.',
    kategori: 'Festival',
    tiketTersedia: [
      { nama: 'Regular', harga: 20000, stok: 300, deskripsi: 'Akses ke semua pertunjukan' },
      { nama: 'VIP', harga: 50000, stok: 50, deskripsi: 'VIP area + meet artist' }
    ]
  },
  {
    nama: 'Konser Musik Kampus',
    deskripsi: 'Konser musik dengan penampilan dari band dan musisi mahasiswa UNESA. Suasana kampus yang energik!',
    kategori: 'Musik',
    tiketTersedia: [
      { nama: 'Early Bird', harga: 25000, stok: 150, deskripsi: 'Pembelian awal' },
      { nama: 'Regular', harga: 40000, stok: 200, deskripsi: 'Tiket reguler' },
      { nama: 'VIP', harga: 75000, stok: 30, deskripsi: 'VIP + backstage pass' }
    ]
  },
  {
    nama: 'Pementasan Teater Mahasiswa',
    deskripsi: 'Pementasan teater karya mahasiswa UNESA. Kisah inspiratif dengan pesan moral yang mendalam.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Regular', harga: 20000, stok: 250, deskripsi: 'Tiket pementasan' },
      { nama: 'Student', harga: 15000, stok: 100, deskripsi: 'Khusus mahasiswa' }
    ]
  },

  // Sports Events
  {
    nama: 'Turnamen Basket Mahasiswa',
    deskripsi: 'Turnamen basket antar fakultas UNESA. Persaingan sengit dengan atmosfer yang mendebarkan!',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Single Match', harga: 15000, stok: 200, deskripsi: '1 pertandingan' },
      { nama: 'All Matches', harga: 50000, stok: 50, deskripsi: 'Semua pertandingan' }
    ]
  },
  {
    nama: 'Fun Run UNESA',
    deskripsi: 'Acara lari santai 5K mengelilingi kampus UNESA. Cocok untuk mahasiswa dan masyarakat sekitar.',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Runner', harga: 25000, stok: 300, deskripsi: 'Kaos + medali + snack' },
      { nama: 'Family Package', harga: 75000, stok: 50, deskripsi: 'Paket 4 orang' }
    ]
  },
  {
    nama: 'Kompetisi E-Sports UNESA',
    deskripsi: 'Turnamen e-sports dengan berbagai game populer. Kompetisi antar mahasiswa berbakat gaming.',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Single Game', harga: 10000, stok: 150, deskripsi: '1 game tournament' },
      { nama: 'All Games', harga: 30000, stok: 50, deskripsi: 'Semua game tournament' }
    ]
  },

  // Career & Professional Events
  {
    nama: 'Job Fair UNESA',
    deskripsi: 'Pameran kerja untuk mahasiswa UNESA. Bertemu langsung dengan perusahaan ternama dan lakukan interview.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Peserta', harga: 0, stok: 500, deskripsi: 'Gratis untuk mahasiswa UNESA' }
    ]
  },
  {
    nama: 'Seminar Karir & Entrepreneurship',
    deskripsi: 'Seminar inspiratif tentang karir dan kewirausahaan. Sharing dari alumni sukses UNESA.',
    kategori: 'Seminar',
    tiketTersedia: [
      { nama: 'Mahasiswa', harga: 20000, stok: 300, deskripsi: 'Khusus mahasiswa UNESA' },
      { nama: 'Umum', harga: 40000, stok: 100, deskripsi: 'Alumni + umum' }
    ]
  },
  {
    nama: 'Workshop CV & Interview Skills',
    deskripsi: 'Workshop praktis membuat CV menarik dan teknik interview yang efektif. Persiapan karir mahasiswa.',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Peserta', harga: 25000, stok: 200, deskripsi: 'Workshop + template CV' },
      { nama: 'Premium', harga: 50000, stok: 30, deskripsi: 'Premium + mock interview' }
    ]
  },

  // Social & Community Events
  {
    nama: 'Bazaar Kuliner Mahasiswa',
    deskripsi: 'Bazaar kuliner dengan berbagai makanan khas dari mahasiswa UNESA. Nikmati cita rasa kampus!',
    kategori: 'Festival',
    tiketTersedia: [
      { nama: 'Free Entry', harga: 0, stok: 1000, deskripsi: 'Gratis masuk' }
    ]
  },
  {
    nama: 'Festival Film Pendek Mahasiswa',
    deskripsi: 'Festival film pendek karya mahasiswa UNESA. Kompetisi dan pameran film kreatif.',
    kategori: 'Festival',
    tiketTersedia: [
      { nama: 'Regular', harga: 15000, stok: 200, deskripsi: 'Akses semua film' },
      { nama: 'VIP', harga: 30000, stok: 50, deskripsi: 'VIP + meet filmmaker' }
    ]
  },
  {
    nama: 'Malam Tirakatan Ramadhan',
    deskripsi: 'Acara keagamaan malam tirakatan di bulan Ramadhan. Kultum dan doa bersama seluruh civitas UNESA.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Peserta', harga: 0, stok: 800, deskripsi: 'Gratis untuk semua' }
    ]
  }
];

const seedUsers = async () => {
  try {
    // Hapus users yang sudah ada untuk re-seed
    await User.deleteMany();

    const users = [
      {
        nama: 'Admin NESAVENT',
        email: 'admin@nesavent.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123 hashed
        nomorTelepon: '081234567890',
        role: 'admin',
        organisasi: 'Universitas Negeri Surabaya',
        slug: 'admin-nesavent'
      }
    ];

    // Create 15 mitra users - UNESA organizations
    const mitraOrganizations = [
      'BEM UNESA', 'UKM Musik UNESA', 'UKM Tari UNESA', 'UKM Teater UNESA',
      'UKM Olahraga UNESA', 'UKM Fotografi UNESA', 'HMJ Teknik Informatika',
      'HMJ Manajemen', 'HMJ Akuntansi', 'HMJ Hukum', 'HMJ Kedokteran',
      'HMJ Sastra Indonesia', 'LPM CAMPUSS', 'KSR PMI Unit UNESA', 'Pramuka UNESA'
    ];

    for (let i = 1; i <= 15; i++) {
      users.push({
        nama: `Pengurus ${mitraOrganizations[i-1]}`,
        email: `mitra${i}@nesavent.com`,
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123 hashed
        nomorTelepon: `081234567${i.toString().padStart(2, '0')}`,
        role: 'mitra',
        organisasi: mitraOrganizations[i-1],
        slug: `pengurus-${mitraOrganizations[i-1].toLowerCase().replace(/\s+/g, '-').replace('unesa', '').trim()}`
      });
    }

    // Create 30 regular users - UNESA students
    for (let i = 1; i <= 30; i++) {
      const fakultas = ['Teknik', 'Ekonomi', 'Hukum', 'Kedokteran', 'Sastra', 'Ilmu Sosial'];
      const fakulta = fakultas[Math.floor(Math.random() * fakultas.length)];
      users.push({
        nama: `Mahasiswa ${fakulta} ${i}`,
        email: `mhs${i}@nesavent.com`,
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123 hashed
        nomorTelepon: `081234568${i.toString().padStart(2, '0')}`,
        role: 'user',
        slug: `mahasiswa-${fakulta.toLowerCase()}-${i}`
      });
    }

    // Insert users one by one to get their _id values
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ User ${userData.nama} (${userData.role}) berhasil dibuat`);
    }

    console.log('\n🎉 Users seeding selesai!');
    return createdUsers;
  } catch (error) {
    console.error('Error saat seeding users:', error);
    throw error;
  }
};

const seedEvents = async (users) => {
  try {
    // Hapus events yang sudah ada untuk re-seed
    await Event.deleteMany({});

    const mitraUsers = users.filter(u => u.role === 'mitra');
    const events = [];

    // Create 120 events
    for (let i = 1; i <= 120; i++) {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const mitra = mitraUsers[Math.floor(Math.random() * mitraUsers.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const venue = venues[Math.floor(Math.random() * venues.length)];

      // Generate random date between now and 6 months from now
      const eventDate = randomDate(new Date(), new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));

      // Create event name variation
      const eventName = `${template.nama} ${i} - ${city}`;

      // Generate slug
      const slugify = (text) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
      };

      const baseSlug = slugify(eventName);
      let slug = baseSlug;
      let counter = 1;
      const existingSlugs = events.map(e => e.slug);
      while (existingSlugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create ticket variations
      const tiketTersedia = template.tiketTersedia.map(ticket => ({
        ...ticket,
        stok: randomInt(20, 500),
        stokTersisa: function() { return this.stok; }() // Will be set to same as stok
      }));

      // Set stokTersisa to same as stok
      tiketTersedia.forEach(ticket => {
        ticket.stokTersisa = ticket.stok;
      });

      // Select random image from category
      const categoryImages = unsplashImages[template.kategori] || unsplashImages['Lainnya'];
      const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];

      const event = {
        nama: eventName,
        slug,
        deskripsi: template.deskripsi,
        tanggal: eventDate,
        waktu: `${randomInt(6, 22).toString().padStart(2, '0')}:00`,
        lokasi: `${venue} ${city}`,
        kategori: template.kategori,
        tiketTersedia,
        gambar: randomImage,
        penyelenggara: mitra.organisasi,
        status: Math.random() > 0.1 ? 'aktif' : 'pending', // 90% aktif, 10% pending
        createdBy: mitra._id
      };

      events.push(event);
    }

    // Create events in batches to avoid timeout
    const batchSize = 20;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Event.insertMany(batch);
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} events berhasil dibuat`);
    }

    console.log(`\n🎉 Total ${events.length} events seeding selesai!`);
  } catch (error) {
    console.error('Error saat seeding events:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    const users = await seedUsers();
    await seedEvents(users);

    console.log('\n======================================');
    console.log('🎉 SEEDING LENGKAP! NESAVENT - UNESA Events');
    console.log('======================================');
    console.log('\nAkun yang tersedia:');
    console.log('-------------------------------------');
    console.log('ADMIN:');
    console.log('  Email: admin@nesavent.com');
    console.log('  Password: password123');
    console.log('\nMITRA (15 akun - Organisasi UNESA):');
    console.log('  Email: mitra1@nesavent.com - mitra15@nesavent.com');
    console.log('  Password: password123');
    console.log('\nUSER (30 akun - Mahasiswa UNESA):');
    console.log('  Email: mhs1@nesavent.com - mhs30@nesavent.com');
    console.log('  Password: password123');
    console.log('\n======================================');
    console.log('Events: 120+ events khusus UNESA');
    console.log('  - Seminar & Workshop Akademik');
    console.log('  - Festival Seni & Budaya');
    console.log('  - Turnamen Olahraga');
    console.log('  - Event Karir & Kewirausahaan');
    console.log('  - Acara Sosial & Keagamaan');
    console.log('======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error saat seeding:', error);
    process.exit(1);
  }
};

connectDB().then(() => runSeed());
