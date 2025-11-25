/**
 * Helper untuk validasi event apakah dummy atau real
 * Menggunakan beberapa kriteria untuk mendeteksi event dummy
 */

const isDummyEvent = (eventData) => {
  const reasons = [];
  let score = 0;

  // 1. Cek nama event (kata-kata umum/placeholder)
  const dummyKeywords = ['test', 'testing', 'dummy', 'contoh', 'coba', 'sample', 'placeholder', 'xxx', 'zzz', 'asdf'];
  const namaLower = eventData.nama.toLowerCase();
  
  if (dummyKeywords.some(keyword => namaLower.includes(keyword))) {
    score += 30;
    reasons.push('Nama event mengandung kata placeholder/testing');
  }

  // 2. Cek panjang deskripsi (terlalu pendek atau generic)
  if (eventData.deskripsi.length < 50) {
    score += 20;
    reasons.push('Deskripsi event terlalu singkat (minimal 50 karakter)');
  }

  const dummyDescKeywords = ['lorem ipsum', 'lorem', 'ipsum', 'test test', 'coba coba'];
  const deskripsiLower = eventData.deskripsi.toLowerCase();
  
  if (dummyDescKeywords.some(keyword => deskripsiLower.includes(keyword))) {
    score += 30;
    reasons.push('Deskripsi event mengandung teks placeholder');
  }

  // 3. Cek lokasi (terlalu generic atau placeholder)
  const dummyLocations = ['test', 'testing', 'dummy', 'xxx', 'lokasi', 'tempat', 'alamat'];
  const lokasiLower = eventData.lokasi.toLowerCase();
  
  if (dummyLocations.some(loc => lokasiLower.includes(loc))) {
    score += 25;
    reasons.push('Lokasi event terlihat tidak valid');
  }

  if (eventData.lokasi.length < 10) {
    score += 15;
    reasons.push('Lokasi event terlalu singkat (minimal 10 karakter)');
  }

  // 4. Cek harga tiket (terlalu murah atau pattern mencurigakan)
  if (eventData.tiketTersedia && eventData.tiketTersedia.length > 0) {
    const allPrices = eventData.tiketTersedia.map(t => t.harga);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    // Harga terlalu murah (< Rp 1.000)
    if (minPrice < 1000 && minPrice > 0) {
      score += 15;
      reasons.push('Harga tiket terlalu murah (< Rp 1.000)');
    }

    // Semua harga sama persis atau pattern 1111, 2222, dll
    if (allPrices.length > 1 && allPrices.every(p => p === allPrices[0])) {
      const priceStr = allPrices[0].toString();
      if (/^(\d)\1+$/.test(priceStr)) {
        score += 20;
        reasons.push('Harga tiket memiliki pattern mencurigakan');
      }
    }

    // Cek nama tiket
    const dummyTicketNames = ['test', 'testing', 'dummy', 'tiket 1', 'tiket 2', 'xxx'];
    eventData.tiketTersedia.forEach(tiket => {
      const namaTiketLower = tiket.nama.toLowerCase();
      if (dummyTicketNames.some(name => namaTiketLower.includes(name))) {
        score += 10;
        reasons.push(`Nama tiket "${tiket.nama}" terlihat seperti placeholder`);
      }
    });
  }

  // 5. Cek tanggal (tanggal di masa lalu atau terlalu jauh di masa depan)
  const eventDate = new Date(eventData.tanggal);
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (eventDate < today) {
    score += 25;
    reasons.push('Tanggal event sudah berlalu');
  }

  if (eventDate > oneYearFromNow) {
    score += 10;
    reasons.push('Tanggal event terlalu jauh di masa depan (> 1 tahun)');
  }

  // 6. Cek waktu (format atau nilai yang tidak wajar)
  if (!eventData.waktu.match(/^\d{2}:\d{2}$/)) {
    score += 10;
    reasons.push('Format waktu tidak valid');
  }

  // 7. Cek penyelenggara
  const dummyOrganizers = ['test', 'testing', 'dummy', 'admin', 'user'];
  const penyelenggaraLower = eventData.penyelenggara.toLowerCase();
  
  if (dummyOrganizers.some(org => penyelenggaraLower === org)) {
    score += 15;
    reasons.push('Nama penyelenggara terlihat tidak valid');
  }

  // Kembalikan hasil
  const isDummy = score >= 50; // Threshold 50 poin

  return {
    isDummy,
    score,
    reasons: isDummy ? reasons : [],
    status: isDummy ? 'ditolak' : 'pending',
    message: isDummy 
      ? `Event terdeteksi sebagai dummy/palsu. Alasan: ${reasons.join(', ')}` 
      : 'Event terlihat valid dan akan diverifikasi oleh admin'
  };
};

module.exports = { isDummyEvent };
