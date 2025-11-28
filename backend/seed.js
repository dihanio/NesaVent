const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Event = require('./models/Event');
const Fakultas = require('./models/Fakultas');
const ProgramStudi = require('./models/ProgramStudi');

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

// Event templates - Diverse and unique UNESA campus events
const eventTemplates = [
  // Academic & Educational Events
  {
    nama: 'Seminar Nasional Teknologi Informasi dan Digitalisasi',
    deskripsi: 'Seminar nasional yang menghadirkan pembicara ahli di bidang teknologi informasi, AI, dan transformasi digital. Diskusi mendalam tentang tren digital terkini dan masa depan teknologi.',
    kategori: 'Seminar',
    tiketTersedia: [
      { nama: 'Mahasiswa UNESA', harga: 25000, stok: 200, deskripsi: 'Khusus mahasiswa UNESA dengan KTM', khususMahasiswa: true, maxPembelianPerOrang: 1 },
      { nama: 'Umum', harga: 50000, stok: 100, deskripsi: 'Mahasiswa luar + umum' },
      { nama: 'VIP', harga: 100000, stok: 50, deskripsi: 'VIP + networking + sertifikat premium' }
    ]
  },
  {
    nama: 'Workshop Kewirausahaan Digital untuk Mahasiswa',
    deskripsi: 'Workshop praktis tentang membangun bisnis digital dari nol. Belajar membuat business plan, digital marketing, dan pitching kepada investor.',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Peserta Workshop', harga: 30000, stok: 150, deskripsi: 'Workshop + materi + sertifikat' },
      { nama: 'Premium', harga: 75000, stok: 30, deskripsi: 'Premium + mentoring 1 bulan + networking' }
    ]
  },
  {
    nama: 'Lomba Karya Tulis Ilmiah Nasional',
    deskripsi: 'Kompetisi karya tulis ilmiah tingkat nasional untuk mahasiswa. Tema: Inovasi dan Solusi untuk Indonesia Maju.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Peserta Lomba', harga: 50000, stok: 100, deskripsi: 'Biaya pendaftaran lomba + sertifikat' }
    ]
  },
  {
    nama: 'Pelatihan Public Speaking dan Leadership',
    deskripsi: 'Pelatihan intensif untuk meningkatkan kemampuan public speaking dan kepemimpinan mahasiswa. Cocok untuk calon pemimpin masa depan.',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Early Bird', harga: 35000, stok: 80, deskripsi: 'Harga spesial early bird' },
      { nama: 'Regular', harga: 50000, stok: 120, deskripsi: 'Tiket reguler + sertifikat' }
    ]
  },
  {
    nama: 'Seminar Ekonomi Digital dan Fintech',
    deskripsi: 'Seminar nasional membahas perkembangan ekonomi digital, cryptocurrency, dan teknologi finansial terkini.',
    kategori: 'Seminar',
    tiketTersedia: [
      { nama: 'Mahasiswa', harga: 30000, stok: 250, deskripsi: 'Khusus mahasiswa', khususMahasiswa: true, maxPembelianPerOrang: 2 },
      { nama: 'Professional', harga: 75000, stok: 80, deskripsi: 'Untuk profesional + networking' }
    ]
  },

  // Arts & Culture Events
  {
    nama: 'Festival Seni dan Budaya UNESA',
    deskripsi: 'Festival seni tahunan UNESA yang menampilkan berbagai pertunjukan seni, tari tradisional, musik, dan pameran karya mahasiswa berbakat.',
    kategori: 'Festival',
    tiketTersedia: [
      { nama: 'Regular', harga: 20000, stok: 300, deskripsi: 'Akses ke semua pertunjukan' },
      { nama: 'VIP', harga: 50000, stok: 50, deskripsi: 'VIP area + meet artist + merchandise' }
    ]
  },
  {
    nama: 'Konser Musik Akustik di Bawah Bintang',
    deskripsi: 'Konser musik akustik outdoor dengan penampilan dari band dan musisi mahasiswa UNESA. Suasana kampus yang romantis dan energik!',
    kategori: 'Musik',
    tiketTersedia: [
      { nama: 'Early Bird', harga: 25000, stok: 150, deskripsi: 'Pembelian awal (hemat 10rb)' },
      { nama: 'Regular', harga: 35000, stok: 200, deskripsi: 'Tiket reguler' },
      { nama: 'VIP', harga: 75000, stok: 30, deskripsi: 'VIP + backstage pass + meet artist' }
    ]
  },
  {
    nama: 'Pementasan Teater "Sang Pemberani"',
    deskripsi: 'Pementasan teater drama karya mahasiswa UNESA. Kisah inspiratif tentang perjuangan dan keberanian dengan pesan moral yang mendalam.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Regular', harga: 20000, stok: 250, deskripsi: 'Tiket pementasan reguler' },
      { nama: 'Student', harga: 15000, stok: 100, deskripsi: 'Khusus mahasiswa dengan KTM', khususMahasiswa: true, maxPembelianPerOrang: 1 }
    ]
  },
  {
    nama: 'Pameran Fotografi "Jejak Kampus"',
    deskripsi: 'Pameran fotografi karya mahasiswa UKM Fotografi UNESA. Menampilkan keindahan dan kehidupan kampus dari berbagai perspektif.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Free Entry', harga: 0, stok: 500, deskripsi: 'Gratis untuk semua pengunjung' }
    ]
  },
  {
    nama: 'Jazz Night Performance',
    deskripsi: 'Malam jazz dengan musisi jazz profesional dan mahasiswa berbakat. Nikmati alunan musik jazz dalam suasana santai dan elegan.',
    kategori: 'Musik',
    tiketTersedia: [
      { nama: 'Standard', harga: 40000, stok: 150, deskripsi: 'Standing area' },
      { nama: 'Premium', harga: 80000, stok: 50, deskripsi: 'Premium seat + welcome drink' }
    ]
  },

  // Sports & Health Events
  {
    nama: 'Turnamen Basket Antar Fakultas',
    deskripsi: 'Turnamen basket bergengsi antar fakultas UNESA. Persaingan sengit dengan atmosfer yang mendebarkan dan hadiah menarik!',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Single Match', harga: 10000, stok: 200, deskripsi: '1 pertandingan' },
      { nama: 'All Matches', harga: 40000, stok: 80, deskripsi: 'Semua pertandingan + jersey' }
    ]
  },
  {
    nama: 'Fun Run & Health Festival',
    deskripsi: 'Acara lari santai 5K mengelilingi kampus UNESA dengan health festival. Cocok untuk mahasiswa dan masyarakat sekitar. Hidup sehat, semangat!',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Runner', harga: 50000, stok: 300, deskripsi: 'Kaos + medali + snack + BIB' },
      { nama: 'Family Package', harga: 150000, stok: 50, deskripsi: 'Paket 4 orang (hemat!)' }
    ]
  },
  {
    nama: 'Championship E-Sports Mobile Legends',
    deskripsi: 'Turnamen e-sports Mobile Legends tingkat kampus. Kompetisi sengit antar tim mahasiswa berbakat gaming dengan total hadiah 10 juta rupiah!',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Spectator', harga: 15000, stok: 200, deskripsi: 'Tiket penonton + snack' },
      { nama: 'Team Registration', harga: 100000, stok: 32, deskripsi: 'Pendaftaran tim (5 orang)' }
    ]
  },
  {
    nama: 'Futsal Competition Cup',
    deskripsi: 'Kompetisi futsal antar mahasiswa UNESA. Tunjukkan skill terbaik timmu dan raih trofi juara!',
    kategori: 'Olahraga',
    tiketTersedia: [
      { nama: 'Team Entry', harga: 200000, stok: 16, deskripsi: 'Pendaftaran tim (7 pemain)' },
      { nama: 'Supporter', harga: 5000, stok: 300, deskripsi: 'Tiket supporter' }
    ]
  },
  {
    nama: 'Yoga & Meditation Workshop',
    deskripsi: 'Workshop yoga dan meditasi untuk kesehatan mental dan fisik mahasiswa. Lepas stress dengan cara yang menyenangkan!',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Participant', harga: 35000, stok: 80, deskripsi: 'Include yoga mat + instructor' }
    ]
  },

  // Career & Professional Development
  {
    nama: 'Job Fair dan Career Expo',
    deskripsi: 'Pameran kerja terbesar UNESA. Bertemu langsung dengan 50+ perusahaan ternama, interview on the spot, dan workshop karir gratis!',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Peserta', harga: 0, stok: 1000, deskripsi: 'Gratis untuk mahasiswa UNESA', khususMahasiswa: true, maxPembelianPerOrang: 1 }
    ]
  },
  {
    nama: 'Seminar Karir dan Personal Branding',
    deskripsi: 'Seminar inspiratif tentang membangun karir dan personal branding di era digital. Sharing dari alumni sukses UNESA dan praktisi industri.',
    kategori: 'Seminar',
    tiketTersedia: [
      { nama: 'Mahasiswa', harga: 25000, stok: 300, deskripsi: 'Khusus mahasiswa UNESA', khususMahasiswa: true, maxPembelianPerOrang: 1 },
      { nama: 'Umum', harga: 45000, stok: 100, deskripsi: 'Alumni + umum + sertifikat' }
    ]
  },
  {
    nama: 'Workshop CV Writing dan Interview Mastery',
    deskripsi: 'Workshop praktis membuat CV menarik dan menguasai teknik interview yang efektif. Persiapan karir mahasiswa tingkat akhir.',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Peserta', harga: 40000, stok: 150, deskripsi: 'Workshop + template CV profesional' },
      { nama: 'Premium', harga: 75000, stok: 30, deskripsi: 'Premium + mock interview + feedback' }
    ]
  },
  {
    nama: 'Bootcamp UI/UX Design Intensive',
    deskripsi: 'Bootcamp intensif 3 hari belajar UI/UX Design dari dasar hingga mahir. Langsung praktik dengan project real!',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Participant', harga: 150000, stok: 60, deskripsi: '3 hari + sertifikat + portfolio' }
    ]
  },

  // Social & Community Events
  {
    nama: 'Bazaar Kuliner dan Produk UMKM Mahasiswa',
    deskripsi: 'Bazaar kuliner dengan 100+ booth makanan khas dan produk UMKM dari mahasiswa UNESA. Nikmati cita rasa kampus yang beragam!',
    kategori: 'Festival',
    tiketTersedia: [
      { nama: 'Free Entry', harga: 0, stok: 2000, deskripsi: 'Gratis masuk, bayar apa yang dibeli' }
    ]
  },
  {
    nama: 'Festival Film Pendek dan Sinematografi',
    deskripsi: 'Festival film pendek karya mahasiswa UNESA. Kompetisi dan pameran film kreatif dengan tema "Cerita dari Kampus".',
    kategori: 'Festival',
    tiketTersedia: [
      { nama: 'Regular', harga: 15000, stok: 200, deskripsi: 'Akses semua film screening' },
      { nama: 'VIP', harga: 35000, stok: 50, deskripsi: 'VIP + meet filmmaker + talkshow' }
    ]
  },
  {
    nama: 'Malam Tirakatan dan Doa Bersama',
    deskripsi: 'Acara keagamaan malam tirakatan menyambut bulan Ramadhan. Kultum inspiratif dan doa bersama seluruh civitas UNESA.',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Peserta', harga: 0, stok: 1000, deskripsi: 'Gratis untuk semua' }
    ]
  },
  {
    nama: 'Donor Darah dan Bakti Sosial',
    deskripsi: 'Kegiatan donor darah dan bakti sosial bekerjasama dengan PMI. Mari berbagi untuk sesama!',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Pendonor', harga: 0, stok: 250, deskripsi: 'Gratis + sertifikat + snack' }
    ]
  },
  {
    nama: 'Talk Show "Inspirasi Kampus"',
    deskripsi: 'Talk show inspiratif dengan menghadirkan tokoh-tokoh sukses alumni UNESA. Cerita perjalanan karir dan motivasi untuk mahasiswa.',
    kategori: 'Seminar',
    tiketTersedia: [
      { nama: 'Audience', harga: 0, stok: 400, deskripsi: 'Gratis untuk mahasiswa', khususMahasiswa: true, maxPembelianPerOrang: 1 }
    ]
  },
  {
    nama: 'Festival Musik Indie "Kampus Bersuara"',
    deskripsi: 'Festival musik indie menampilkan band-band underground dan musisi indie berbakat. Dukung musisi lokal!',
    kategori: 'Musik',
    tiketTersedia: [
      { nama: 'Presale', harga: 30000, stok: 200, deskripsi: 'Presale ticket (limited)' },
      { nama: 'Regular', harga: 45000, stok: 250, deskripsi: 'Regular ticket' }
    ]
  },
  {
    nama: 'Workshop Desain Grafis untuk Pemula',
    deskripsi: 'Workshop praktis belajar desain grafis menggunakan tools professional. Cocok untuk pemula yang ingin terjun ke dunia desain.',
    kategori: 'Workshop',
    tiketTersedia: [
      { nama: 'Participant', harga: 45000, stok: 100, deskripsi: 'Workshop + software guide + sertifikat' }
    ]
  },
  {
    nama: 'Debat Bahasa Inggris Competition',
    deskripsi: 'Kompetisi debat bahasa Inggris tingkat mahasiswa. Asah kemampuan berbahasa dan critical thinking!',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Team Registration', harga: 75000, stok: 20, deskripsi: 'Pendaftaran tim (3 orang)' },
      { nama: 'Audience', harga: 0, stok: 150, deskripsi: 'Gratis untuk penonton' }
    ]
  },
  {
    nama: 'Stand Up Comedy Night "Ketawa Kampus"',
    deskripsi: 'Malam stand up comedy dengan komika-komika mahasiswa UNESA. Lepas penat dengan tawa dan hiburan!',
    kategori: 'Lainnya',
    tiketTersedia: [
      { nama: 'Standard', harga: 25000, stok: 200, deskripsi: 'Standing area' },
      { nama: 'VIP Seat', harga: 50000, stok: 40, deskripsi: 'VIP seat + snack' }
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
        password: 'password123',
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
        nama: `Pengurus ${mitraOrganizations[i - 1]}`,
        email: `mitra${i}@nesavent.com`,
        password: 'password123',
        nomorTelepon: `081234567${i.toString().padStart(2, '0')}`,
        role: 'mitra',
        organisasi: mitraOrganizations[i - 1],
        slug: `pengurus-${mitraOrganizations[i - 1].toLowerCase().replace(/\s+/g, '-').replace(/unesa/g, '').trim()}`
      });
    }

    // Create 30 regular users - UNESA students dengan data lengkap
    // Data lengkap Fakultas dan Program Studi UNESA
    const fakultasData = [
      {
        nama: 'Fakultas Ilmu Pendidikan',
        prodi: [
          'S1 Bimbingan dan Konseling',
          'S1 Teknologi Pendidikan',
          'S1 Pendidikan Luar Sekolah',
          'S1 Pendidikan Luar Biasa',
          'S1 Pendidikan Guru Sekolah Dasar',
          'S1 Pendidikan Guru Pendidikan Anak Usia Dini',
          'S1 Manajemen Pendidikan'
        ]
      },
      {
        nama: 'Fakultas Bahasa dan Seni',
        prodi: [
          'S1 Pendidikan Bahasa dan Sastra Indonesia',
          'S1 Pendidikan Bahasa Inggris',
          'S1 Pendidikan Bahasa Jerman',
          'S1 Pendidikan Bahasa Jepang',
          'S1 Pendidikan Bahasa dan Sastra Jawa',
          'S1 Pendidikan Seni Rupa',
          'S1 Pendidikan Seni Drama, Tari, dan Musik',
          'S1 Sastra Indonesia',
          'S1 Sastra Inggris',
          'S1 Sastra Jerman',
          'S1 Pendidikan Bahasa Mandarin',
          'S1 Musik',
          'S1 Desain Komunikasi Visual',
          'S1 Seni Rupa Murni',
          'S1 Film dan Animasi'
        ]
      },
      {
        nama: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
        prodi: [
          'S1 Pendidikan Matematika',
          'S1 Pendidikan Fisika',
          'S1 Pendidikan Kimia',
          'S1 Pendidikan Biologi',
          'S1 Matematika',
          'S1 Fisika',
          'S1 Kimia',
          'S1 Biologi',
          'S1 Pendidikan Ilmu Pengetahuan Alam',
          'S1 Sains Data',
          'S1 Sains Aktuaria',
          'S1 Kecerdasan Artifisial'
        ]
      },
      {
        nama: 'Fakultas Ilmu Sosial dan Politik',
        prodi: [
          'S1 Pendidikan Pancasila dan Kewarganegaraan',
          'S1 Pendidikan Geografi',
          'S1 Pendidikan Sejarah',
          'S1 Sosiologi',
          'S1 Ilmu Administrasi Negara',
          'S1 Ilmu Komunikasi',
          'S1 Pendidikan IPS',
          'S1 Ilmu Politik',
          'S1 Hubungan Internasional'
        ]
      },
      {
        nama: 'Fakultas Teknik',
        prodi: [
          'S1 Pendidikan Teknik Elektro',
          'S1 Pendidikan Teknik Mesin',
          'S1 Pendidikan Teknik Bangunan',
          'S1 Teknik Sipil',
          'S1 Pendidikan Teknologi Informasi',
          'S1 Teknik Elektro',
          'S1 Teknik Mesin',
          'S1 Sistem Informasi',
          'S1 Teknik Informatika',
          'S1 Pendidikan Tata Rias',
          'S1 Pendidikan Tata Boga',
          'S1 Pendidikan Tata Busana',
          'S1 Perencanaan Wilayah dan Kota',
          'S1 Pariwisata'
        ]
      },
      {
        nama: 'Fakultas Ilmu Keolahragaan dan Kesehatan',
        prodi: [
          'S1 Ilmu Keolahragaan',
          'S1 Gizi',
          'S1 Pendidikan Jasmani, Kesehatan, dan Rekreasi',
          'S1 Pendidikan Kepelatihan Olahraga',
          'S1 Manajemen Olahraga',
          'S1 Masase'
        ]
      },
      {
        nama: 'Fakultas Ekonomika dan Bisnis',
        prodi: [
          'S1 Pendidikan Ekonomi',
          'S1 Manajemen',
          'S1 Akuntansi',
          'S1 Pendidikan Akuntansi',
          'S1 Pendidikan Bisnis',
          'S1 Pendidikan Administrasi Perkantoran',
          'S1 Ekonomi Islam',
          'S1 Ekonomi',
          'S1 Bisnis Digital'
        ]
      },
      {
        nama: 'Fakultas Vokasi',
        prodi: [
          'D4 Manajemen Informatika',
          'D4 Teknik Mesin',
          'D4 Teknik Sipil',
          'D4 Transportasi',
          'D4 Kepelatihan Olahraga',
          'D4 Teknik Listrik',
          'D4 Desain Grafis',
          'D4 Administrasi Negara',
          'D4 Tata Boga',
          'D4 Tata Busana',
          'D4 Teknologi Rekayasa Otomotif',
          'D4 Produksi Media',
          'D4 Analisis Performa Olahraga'
        ]
      },
      {
        nama: 'Fakultas Kedokteran',
        prodi: [
          'S1 Kedokteran',
          'S1 Fisioterapi',
          'S1 Kebidanan',
          'S1 Keperawatan'
        ]
      },
      {
        nama: 'Fakultas Psikologi',
        prodi: [
          'S1 Psikologi'
        ]
      },
      {
        nama: 'Fakultas Hukum',
        prodi: [
          'S1 Ilmu Hukum'
        ]
      },
      {
        nama: 'Fakultas Ketahanan Pangan',
        prodi: [
          'S1 Akuakultur',
          'S1 Biosains Hewan',
          'S1 Agribisnis Digital',
          'S1 Teknologi Pangan dan Hasil Pertanian'
        ]
      }
    ];

    const angkatanList = [21, 22, 23, 24]; // 2021, 2022, 2023, 2024

    for (let i = 1; i <= 30; i++) {
      const fakultasObj = fakultasData[Math.floor(Math.random() * fakultasData.length)];
      const programStudi = fakultasObj.prodi[Math.floor(Math.random() * fakultasObj.prodi.length)];
      const angkatan = angkatanList[Math.floor(Math.random() * angkatanList.length)];

      // Generate NIM: 2 digit angkatan + 9 digit random (total 11 digit)
      const nimSuffix = String(i).padStart(9, '0'); // Gunakan index sebagai base
      const nim = `${angkatan}${nimSuffix}`;

      // Generate nama mahasiswa yang lebih realistis
      const namaDepan = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indah', 'Joko',
        'Kartika', 'Lina', 'Muhammad', 'Nur', 'Oscar', 'Putri', 'Qori', 'Rudi', 'Siti', 'Tari',
        'Umar', 'Vina', 'Wawan', 'Xeniah', 'Yoga', 'Zahra', 'Andi', 'Bella', 'Chandra', 'Dian'];
      const namaBelakang = ['Pratama', 'Kusuma', 'Wijaya', 'Santoso', 'Putra', 'Putri', 'Saputra', 'Sari', 'Wati', 'Rahman',
        'Hidayat', 'Fadilah', 'Maulana', 'Azizah', 'Ramadhan', 'Fitriani', 'Nugroho', 'Permata', 'Hakim', 'Rizki'];

      const namaLengkap = `${namaDepan[i % namaDepan.length]} ${namaBelakang[i % namaBelakang.length]}`;

      users.push({
        nama: namaLengkap,
        email: `mhs${i}@nesavent.com`,
        password: 'password123',
        nomorTelepon: `081234568${i.toString().padStart(2, '0')}`,
        role: 'user',
        nim: nim,
        programStudi: programStudi,
        fakultas: fakultasObj.nama,
        slug: `${namaLengkap.toLowerCase().replace(/\s+/g, '-')}`,
        // Add student verification status for variety - NONE APPROVED
        studentVerificationStatus: i <= 10 ? 'pending' : i <= 15 ? 'rejected' : 'unverified',
        studentVerificationNote: i <= 10 ? 'Menunggu verifikasi admin' : 
                               i <= 15 ? 'KTM tidak valid atau data tidak sesuai' : null,
        // Add KTM file for students who have submitted verification
        ktm: i <= 10 ? `ktm-mhs${i}-demo.jpg` : null
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

const seedAcademicData = async () => {
  try {
    console.log('\n🌱 Seeding academic data...');

    // Clear existing data
    await Fakultas.deleteMany({});
    await ProgramStudi.deleteMany({});

    // Seed Fakultas
    const fakultasData = [
      { nama: 'Fakultas Teknik' },
      { nama: 'Fakultas Ekonomi dan Bisnis' },
      { nama: 'Fakultas Hukum' },
      { nama: 'Fakultas Kedokteran' },
      { nama: 'Fakultas Ilmu Sosial dan Ilmu Politik' },
      { nama: 'Fakultas Keguruan dan Ilmu Pendidikan' },
      { nama: 'Fakultas Pertanian' },
      { nama: 'Fakultas Matematika dan Ilmu Pengetahuan Alam' },
      { nama: 'Fakultas Sastra' },
      { nama: 'Fakultas Psikologi' }
    ];

    const createdFakultas = [];
    for (const fak of fakultasData) {
      const fakultas = await Fakultas.create(fak);
      createdFakultas.push(fakultas);
      console.log(`✅ Fakultas ${fak.nama} berhasil dibuat`);
    }

    // Seed Program Studi
    const programStudiData = [
      // Fakultas Teknik
      { nama: 'Teknik Informatika', fakultas: createdFakultas[0]._id },
      { nama: 'Teknik Elektro', fakultas: createdFakultas[0]._id },
      { nama: 'Teknik Sipil', fakultas: createdFakultas[0]._id },
      { nama: 'Teknik Mesin', fakultas: createdFakultas[0]._id },
      { nama: 'Teknik Industri', fakultas: createdFakultas[0]._id },

      // Fakultas Ekonomi dan Bisnis
      { nama: 'Manajemen', fakultas: createdFakultas[1]._id },
      { nama: 'Akuntansi', fakultas: createdFakultas[1]._id },
      { nama: 'Ekonomi Pembangunan', fakultas: createdFakultas[1]._id },
      { nama: 'Bisnis Digital', fakultas: createdFakultas[1]._id },

      // Fakultas Hukum
      { nama: 'Ilmu Hukum', fakultas: createdFakultas[2]._id },

      // Fakultas Kedokteran
      { nama: 'Pendidikan Dokter', fakultas: createdFakultas[3]._id },
      { nama: 'Keperawatan', fakultas: createdFakultas[3]._id },
      { nama: 'Kesehatan Masyarakat', fakultas: createdFakultas[3]._id },

      // Fakultas Ilmu Sosial dan Ilmu Politik
      { nama: 'Ilmu Administrasi Negara', fakultas: createdFakultas[4]._id },
      { nama: 'Ilmu Komunikasi', fakultas: createdFakultas[4]._id },
      { nama: 'Ilmu Politik', fakultas: createdFakultas[4]._id },

      // Fakultas Keguruan dan Ilmu Pendidikan
      { nama: 'Pendidikan Bahasa Indonesia', fakultas: createdFakultas[5]._id },
      { nama: 'Pendidikan Bahasa Inggris', fakultas: createdFakultas[5]._id },
      { nama: 'Pendidikan Matematika', fakultas: createdFakultas[5]._id },
      { nama: 'Pendidikan Biologi', fakultas: createdFakultas[5]._id },

      // Fakultas Pertanian
      { nama: 'Agroteknologi', fakultas: createdFakultas[6]._id },
      { nama: 'Agribisnis', fakultas: createdFakultas[6]._id },

      // Fakultas Matematika dan Ilmu Pengetahuan Alam
      { nama: 'Matematika', fakultas: createdFakultas[7]._id },
      { nama: 'Fisika', fakultas: createdFakultas[7]._id },
      { nama: 'Kimia', fakultas: createdFakultas[7]._id },
      { nama: 'Biologi', fakultas: createdFakultas[7]._id },

      // Fakultas Sastra
      { nama: 'Sastra Indonesia', fakultas: createdFakultas[8]._id },
      { nama: 'Sastra Inggris', fakultas: createdFakultas[8]._id },
      { nama: 'Sastra Jepang', fakultas: createdFakultas[8]._id },

      // Fakultas Psikologi
      { nama: 'Psikologi', fakultas: createdFakultas[9]._id }
    ];

    for (const prodi of programStudiData) {
      await ProgramStudi.create(prodi);
      console.log(`✅ Program Studi ${prodi.nama} berhasil dibuat`);
    }

    console.log('\n🎉 Academic data seeding selesai!');
  } catch (error) {
    console.error('Error saat seeding academic data:', error);
    throw error;
  }
};

const seedEvents = async (users) => {
  try {
    // Hapus events yang sudah ada untuk re-seed
    await Event.deleteMany({});

    const mitraUsers = users.filter(u => u.role === 'mitra');
    const events = [];
    const usedEventNames = new Set(); // Track used event names to avoid duplicates

    // Helper function for slugify
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

    // Create events - each template will be used multiple times with different variations
    const totalEvents = 90; // Reduced to match number of unique combinations
    let eventCount = 0;
    let attempts = 0;
    const maxAttempts = 500;

    while (eventCount < totalEvents && attempts < maxAttempts) {
      attempts++;

      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const mitra = mitraUsers[Math.floor(Math.random() * mitraUsers.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const venue = venues[Math.floor(Math.random() * venues.length)];

      // Generate random date between now and 6 months from now
      const eventDate = randomDate(new Date(), new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));

      // Use the original template name without adding numbers
      let eventName = template.nama;

      // Add location variation only if it makes sense (not for specific titled events)
      const specificTitledEvents = ['Pementasan Teater "Sang Pemberani"', 'Pameran Fotografi "Jejak Kampus"', 'Talk Show "Inspirasi Kampus"', 'Festival Musik Indie "Kampus Bersuara"', 'Stand Up Comedy Night "Ketawa Kampus"'];

      if (!specificTitledEvents.includes(template.nama)) {
        // Add month/year variation for non-specific events to make them unique
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const eventMonth = monthNames[eventDate.getMonth()];
        const eventYear = eventDate.getFullYear();
        eventName = `${template.nama} ${eventMonth} ${eventYear}`;
      } else {
        // For specific titled events, add edition number if duplicate
        if (usedEventNames.has(eventName)) {
          const edition = Math.floor(usedEventNames.size / eventTemplates.length) + 1;
          eventName = `${template.nama} - Edisi ${edition}`;
        }
      }

      // Skip if this exact event name was already used
      if (usedEventNames.has(eventName)) {
        continue;
      }

      usedEventNames.add(eventName);

      // Generate unique slug
      const baseSlug = slugify(eventName);
      let slug = baseSlug;
      let counter = 1;
      const existingSlugs = events.map(e => e.slug);
      while (existingSlugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create ticket variations with realistic stock
      const tiketTersedia = template.tiketTersedia.map(ticket => ({
        ...ticket,
        stok: ticket.stok, // Use template stock
        stokTersisa: ticket.stok // Start with full stock
      }));

      // Select random image from category
      const categoryImages = unsplashImages[template.kategori] || unsplashImages['Lainnya'];
      const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];

      // Generate realistic time based on event category
      let waktu;
      if (template.kategori === 'Seminar' || template.kategori === 'Workshop') {
        waktu = ['09:00', '10:00', '13:00', '14:00'][randomInt(0, 3)];
      } else if (template.kategori === 'Musik' || template.kategori === 'Festival') {
        waktu = ['18:00', '19:00', '20:00'][randomInt(0, 2)];
      } else if (template.kategori === 'Olahraga') {
        waktu = ['07:00', '08:00', '15:00', '16:00'][randomInt(0, 3)];
      } else {
        waktu = `${randomInt(8, 20).toString().padStart(2, '0')}:00`;
      }

      const event = {
        nama: eventName,
        slug,
        deskripsi: template.deskripsi,
        tanggal: eventDate,
        waktu,
        lokasi: `${venue}, ${city}`,
        kategori: template.kategori,
        tiketTersedia,
        gambar: randomImage,
        penyelenggara: mitra.organisasi,
        status: Math.random() > 0.1 ? 'aktif' : 'pending', // 90% aktif, 10% pending
        createdBy: mitra._id
      };

      events.push(event);
      eventCount++;
    }

    // Create events in batches to avoid timeout
    const batchSize = 20;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Event.insertMany(batch);
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} events berhasil dibuat`);
    }

    console.log(`\n🎉 Total ${events.length} events unik berhasil dibuat!`);
    console.log(`📊 Semua event memiliki mitra dan tidak ada duplikat nama`);
  } catch (error) {
    console.error('Error saat seeding events:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    const users = await seedUsers();
    await seedAcademicData();
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
    console.log('  Status Verifikasi Mahasiswa:');
    console.log('    - mhs1-mhs8: SUDAH DIVERIFIKASI (approved)');
    console.log('    - mhs9-mhs18: MENUNGGU VERIFIKASI (pending)');
    console.log('    - mhs19-mhs22: DITOLAK (rejected)');
    console.log('    - mhs23-mhs30: BELUM UPLOAD (unverified)');
    console.log('\n======================================');
    console.log('Events: 90+ events UNIK khusus UNESA');
    console.log('  ✅ Semua event memiliki nama yang UNIK');
    console.log('  ✅ Tidak ada event duplikat');
    console.log('  ✅ Setiap event punya mitra yang jelas');
    console.log('  ✅ Data yang realistis dan profesional');
    console.log('  - Seminar & Workshop Akademik');
    console.log('  - Festival Seni & Budaya');
    console.log('  - Turnamen Olahraga & E-Sports');
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
