// Fungsi untuk format tanggal ke bahasa Indonesia
export const formatTanggal = (tanggal: string) => {
  const date = new Date(tanggal);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Fungsi untuk format tanggal dengan jam
export const formatTanggalWaktu = (tanggal: string) => {
  const date = new Date(tanggal);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${hours}:${minutes} WIB`;
};

// Fungsi untuk format waktu dengan WIB
export const formatWaktu = (waktu: string) => {
  return `${waktu} WIB`;
};

// Fungsi untuk format harga Rupiah
export const formatHarga = (harga: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(harga);
};
