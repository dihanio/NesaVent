'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    tanggal: '',
    waktu: '',
    lokasi: '',
    kategori: 'Musik',
    gambar: '',
    penyelenggara: '',
    status: 'aktif',
  });

  const [tiketTersedia, setTiketTersedia] = useState([
    { _id: '', nama: 'Regular', harga: '', stok: '', stokTersisa: '', deskripsi: '', maxPembelianPerOrang: '', mulaiJual: '', akhirJual: '' }
  ]);

  const kategoriList = ['Musik', 'Olahraga', 'Seminar', 'Workshop', 'Festival', 'Lainnya'];
  const statusList = ['aktif', 'selesai', 'dibatalkan'];

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!authService.isMitra()) {
      router.push('/');
      return;
    }
    fetchEvent();
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${params.id}`);
      const event = response.data;
      
      // Format tanggal untuk input type="date"
      const tanggalFormatted = new Date(event.tanggal).toISOString().split('T')[0];
      
      setFormData({
        nama: event.nama,
        deskripsi: event.deskripsi,
        tanggal: tanggalFormatted,
        waktu: event.waktu,
        lokasi: event.lokasi,
        kategori: event.kategori,
        gambar: event.gambar,
        penyelenggara: event.penyelenggara,
        status: event.status,
      });

      // Load ticket types
      if (event.tiketTersedia && event.tiketTersedia.length > 0) {
        setTiketTersedia(event.tiketTersedia.map((t: any) => {
          // Format datetime untuk input datetime-local (YYYY-MM-DDTHH:mm)
          const formatDateTime = (date: string | null) => {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          };

          return {
            _id: t._id,
            nama: t.nama,
            harga: t.harga.toString(),
            stok: t.stok.toString(),
            stokTersisa: t.stokTersisa.toString(),
            deskripsi: t.deskripsi || '',
            maxPembelianPerOrang: t.maxPembelianPerOrang ? t.maxPembelianPerOrang.toString() : '',
            mulaiJual: formatDateTime(t.mulaiJual),
            akhirJual: formatDateTime(t.akhirJual)
          };
        }));
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Gagal memuat data event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addTiketType = () => {
    setTiketTersedia([...tiketTersedia, { _id: '', nama: '', harga: '', stok: '', stokTersisa: '', deskripsi: '', maxPembelianPerOrang: '', mulaiJual: '', akhirJual: '' }]);
  };

  const removeTiketType = (index: number) => {
    if (tiketTersedia.length > 1) {
      setTiketTersedia(tiketTersedia.filter((_, i) => i !== index));
    }
  };

  const handleTiketChange = (index: number, field: string, value: string) => {
    const updated = [...tiketTersedia];
    updated[index] = { ...updated[index], [field]: value };
    setTiketTersedia(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi tiket
    if (tiketTersedia.length === 0) {
      setError('Minimal harus ada 1 tipe tiket');
      return;
    }

    for (let i = 0; i < tiketTersedia.length; i++) {
      const tiket = tiketTersedia[i];
      if (!tiket.nama || !tiket.harga || !tiket.stok) {
        setError(`Tipe tiket #${i + 1}: Nama, harga, dan stok wajib diisi`);
        return;
      }
      if (Number(tiket.harga) < 0 || Number(tiket.stok) < 1) {
        setError(`Tipe tiket #${i + 1}: Harga dan stok harus valid`);
        return;
      }
    }

    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        tiketTersedia: tiketTersedia.map(t => ({
          _id: t._id || undefined,
          nama: t.nama,
          harga: Number(t.harga),
          stok: Number(t.stok),
          stokTersisa: t._id ? Number(t.stokTersisa) : Number(t.stok),
          deskripsi: t.deskripsi,
          maxPembelianPerOrang: t.maxPembelianPerOrang ? Number(t.maxPembelianPerOrang) : null,
          mulaiJual: t.mulaiJual || null,
          akhirJual: t.akhirJual || null
        }))
      };

      await api.put(`/events/${params.id}`, dataToSend);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengupdate event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus event ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      await api.delete(`/events/${params.id}`);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus event');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat data event...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-linear-to-r from-yellow-50 to-blue-50 rounded-2xl p-8 mb-8 border-2 border-yellow-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-yellow-600 mb-1">Edit Event</h1>
              <p className="text-gray-600 text-lg">Perbarui dan kelola informasi event Anda</p>
            </div>
          </div>
          <div className="bg-yellow-100 border-l-4 border-yellow-600 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">Tips:</span> Perubahan yang Anda lakukan akan langsung mempengaruhi event yang sudah dipublikasikan. Pastikan informasi yang diubah sudah benar.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
          <div className="p-8 md:p-12">

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-start gap-3 animate-shake">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold mb-1">Terjadi Kesalahan</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section: Informasi Dasar */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border-l-4 border-blue-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-600">Informasi Dasar</h2>
                      <p className="text-sm text-blue-600/80">Nama, deskripsi, kategori, dan status event</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Nama Event *
                  </label>
                  <input
                    type="text"
                    name="nama"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="Contoh: Konser Musik Jazz"
                    value={formData.nama}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📄 Deskripsi Event *
                  </label>
                  <textarea
                    name="deskripsi"
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Jelaskan tentang event Anda..."
                    value={formData.deskripsi}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏷️ Kategori Event *
                    </label>
                    <select
                      name="kategori"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                      value={formData.kategori}
                      onChange={handleChange}
                    >
                      {kategoriList.map((kat) => (
                        <option key={kat} value={kat}>
                          {kat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🔄 Status Event *
                    </label>
                    <select
                      name="status"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      {statusList.map((stat) => (
                        <option key={stat} value={stat}>
                          {stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Waktu & Lokasi */}
              <div className="space-y-6">
                <div className="bg-yellow-50 rounded-xl p-4 mb-6 border-l-4 border-yellow-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-yellow-600">Waktu & Lokasi</h2>
                      <p className="text-sm text-yellow-600/80">Jadwal dan tempat pelaksanaan event</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 Tanggal Event *
                    </label>
                    <input
                      type="date"
                      name="tanggal"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-gray-900"
                      value={formData.tanggal}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ⏰ Waktu Event *
                    </label>
                    <input
                      type="time"
                      name="waktu"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-gray-900"
                      value={formData.waktu}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Lokasi Event *
                  </label>
                  <input
                    type="text"
                    name="lokasi"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="Contoh: Gedung Serbaguna Jakarta Pusat, Indonesia"
                    value={formData.lokasi}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Section: Tiket & Harga */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border-l-4 border-blue-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-blue-600">Tipe Tiket</h2>
                        <p className="text-sm text-blue-600/80">Kelola berbagai tipe tiket dengan harga berbeda</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addTiketType}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Tipe
                    </button>
                  </div>
                </div>

                {tiketTersedia.map((tiket, index) => (
                  <div key={index} className="bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6 space-y-4 shadow-md hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        </div>
                        <h3 className="text-lg font-bold text-blue-600">Tipe Tiket #{index + 1}</h3>
                      </div>
                      {tiketTersedia.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTiketType(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition text-sm font-semibold flex items-center gap-2 shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🏷️ Nama Tipe Tiket *
                        </label>
                        <input
                          type="text"
                          value={tiket.nama}
                          onChange={(e) => handleTiketChange(index, 'nama', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                          placeholder="Contoh: VIP, Regular, Early Bird"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          💰 Harga (Rp) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                          <input
                            type="number"
                            value={tiket.harga}
                            onChange={(e) => handleTiketChange(index, 'harga', e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                            placeholder="50000"
                            min="0"
                            step="1000"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🎫 Jumlah Tiket (Stok Awal) *
                        </label>
                        <input
                          type="number"
                          value={tiket.stok}
                          onChange={(e) => handleTiketChange(index, 'stok', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-gray-900"
                          placeholder="100"
                          min="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📝 Deskripsi Singkat
                        </label>
                        <input
                          type="text"
                          value={tiket.deskripsi}
                          onChange={(e) => handleTiketChange(index, 'deskripsi', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-gray-900"
                          placeholder="Contoh: Akses VIP Lounge"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          👥 Maks. Pembelian/Orang
                        </label>
                        <input
                          type="number"
                          value={tiket.maxPembelianPerOrang}
                          onChange={(e) => handleTiketChange(index, 'maxPembelianPerOrang', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                          placeholder="Unlimited"
                          min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kosongkan untuk tanpa batas</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🕐 Mulai Dijual
                        </label>
                        <input
                          type="datetime-local"
                          value={tiket.mulaiJual}
                          onChange={(e) => handleTiketChange(index, 'mulaiJual', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kosongkan untuk langsung dijual</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🕐 Akhir Penjualan
                        </label>
                        <input
                          type="datetime-local"
                          value={tiket.akhirJual}
                          onChange={(e) => handleTiketChange(index, 'akhirJual', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kosongkan untuk sampai event dimulai</p>
                      </div>
                    </div>

                    {tiket._id && tiket.stokTersisa && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-yellow-700 font-medium">Stok Tersisa Saat Ini:</span>
                          <span className="text-yellow-600 font-bold">{tiket.stokTersisa} tiket</span>
                        </div>
                      </div>
                    )}

                    {tiket.harga && tiket.stok && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 font-medium">Potensi pendapatan tipe ini:</span>
                          <span className="text-blue-600 font-bold">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(Number(tiket.harga) * Number(tiket.stok))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {tiketTersedia.some(t => t.harga && t.stok) && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Total Potensi Pendapatan Maksimal:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(
                          tiketTersedia.reduce((total, t) => {
                            return total + (Number(t.harga) || 0) * (Number(t.stok) || 0);
                          }, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-600">Total Tiket Tersedia:</span>
                      <span className="text-gray-700 font-semibold">
                        {tiketTersedia.reduce((total, t) => total + (Number(t.stok) || 0), 0)} tiket
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Media */}
              <div className="space-y-6">
                <div className="bg-yellow-50 rounded-xl p-4 mb-6 border-l-4 border-yellow-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-yellow-600">Gambar Event (Opsional)</h2>
                      <p className="text-sm text-yellow-600/80">Gambar untuk menarik perhatian calon peserta</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🖼️ URL Gambar Event
                  </label>
                  <input
                    type="url"
                    name="gambar"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="https://example.com/event-image.jpg"
                    value={formData.gambar}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-2">Format: JPG, PNG, atau WebP. Ukuran maksimal 2MB</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-linear-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Menyimpan Perubahan...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Update Event</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={saving}
                    className="sm:w-40 bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Batal</span>
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Perubahan akan langsung diterapkan setelah disimpan
                </p>
              </div>

              {/* Delete Button */}
              <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-700 mb-1">Zona Bahaya</h3>
                    <p className="text-sm text-red-600 mb-4">Menghapus event akan menghapus semua data terkait termasuk pesanan dan tiket. Tindakan ini tidak dapat dibatalkan.</p>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="w-full bg-red-600 text-white py-3.5 rounded-xl hover:bg-red-700 transition font-bold text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Hapus Event Permanen</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
