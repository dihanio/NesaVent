'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { CalendarDatePicker } from '@/components/calendar-date-picker';

interface TiketType {
  nama: string;
  harga: string;
  stok: string;
  deskripsi: string;
  maxPembelianPerOrang: string;
  mulaiJual: string;
  akhirJual: string;
  selectedPeriode: DateRange;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    tanggal: '',
    waktu: '',
    lokasi: '',
    kategori: 'Musik',
    gambar: '',
  });

  const [tiketTersedia, setTiketTersedia] = useState<TiketType[]>([
    { nama: 'Regular', harga: '', stok: '', deskripsi: '', maxPembelianPerOrang: '', mulaiJual: '', akhirJual: '', selectedPeriode: {from: undefined, to: undefined} }
  ]);

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const [eventDate, setEventDate] = useState<{from: Date; to: Date} | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const [tiketErrors, setTiketErrors] = useState<string[]>([]);

  const kategoriList = ['Musik', 'Olahraga', 'Seminar', 'Workshop', 'Festival', 'Lainnya'];

  // Helper functions untuk validasi
  const getMinTicketSaleDate = () => {
    return new Date(); // Hari ini
  };

  const getMaxTicketSaleStartDate = (eventDate: Date) => {
    const maxDate = new Date(eventDate);
    maxDate.setMonth(maxDate.getMonth() - 6); // Maksimal 6 bulan sebelum event
    return maxDate;
  };

  const getMaxTicketSaleEndDate = (eventDate: Date) => {
    const maxDate = new Date(eventDate);
    maxDate.setHours(maxDate.getHours() - 1); // Harus sebelum event dimulai
    return maxDate;
  };

  const isValidTicketSalePeriod = (startDate: Date | null, endDate: Date | null, eventDate: Date) => {
    if (!startDate && !endDate) return true; // Boleh kosong
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (startDate && startDate < now) return false;
    if (endDate && endDate >= eventDate) return false;
    if (startDate && endDate && startDate >= endDate) return false;
    
    return true;
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!authService.isMitra()) {
      router.push('/');
      return;
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEventDateSelect = (range: {from: Date; to: Date}) => {
    setEventDate(range);
    if (range.from) {
      const year = range.from.getFullYear();
      const month = String(range.from.getMonth() + 1).padStart(2, '0');
      const day = String(range.from.getDate()).padStart(2, '0');
      setFormData({ ...formData, tanggal: `${year}-${month}-${day}` });
    } else {
      setFormData({ ...formData, tanggal: '' });
    }

    // Reset periode tiket jika tidak valid setelah tanggal event berubah
    if (range.from) {
      const eventDateTime = new Date(range.from);
      if (selectedTime) {
        eventDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      }

      setTiketTersedia(prev => prev.map(tiket => {
        let needsReset = false;

        if (tiket.selectedPeriode.from && tiket.selectedPeriode.from >= eventDateTime) {
          needsReset = true;
        }
        if (tiket.selectedPeriode.to && tiket.selectedPeriode.to >= eventDateTime) {
          needsReset = true;
        }

        if (needsReset) {
          return { ...tiket, selectedPeriode: {from: undefined, to: undefined}, mulaiJual: '', akhirJual: '' };
        }
        return tiket;
      }));
      
      // Reset startTime dan endTime ketika tanggal event berubah
      setStartTime(null);
      setEndTime(null);
      
      // Reset tiket errors karena tanggal event berubah
      setTiketErrors(prev => prev.map(() => ''));
    }
  };

  const handleTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    if (time) {
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      setFormData({ ...formData, waktu: `${hours}:${minutes}` });
    } else {
      setFormData({ ...formData, waktu: '' });
    }
  };

  const addTiketType = () => {
    setTiketTersedia([...tiketTersedia, { 
      nama: '', 
      harga: '', 
      stok: '', 
      deskripsi: '', 
      maxPembelianPerOrang: '', 
      mulaiJual: '', 
      akhirJual: '',
      selectedPeriode: {from: undefined, to: undefined}
    }]);
    setTiketErrors([...tiketErrors, '']);
  };

  const removeTiketType = (index: number) => {
    if (tiketTersedia.length > 1) {
      setTiketTersedia(tiketTersedia.filter((_, i) => i !== index));
      setTiketErrors(tiketErrors.filter((_, i) => i !== index));
    }
  };

  const handleTiketChange = (index: number, field: keyof TiketType, value: string | Date | null) => {
    const updated = [...tiketTersedia];
    updated[index] = { ...updated[index], [field]: value };
    setTiketTersedia(updated);
  };

  const handleTiketDateTimeChange = (index: number, range: {from: Date; to: Date}) => {
    console.log('handleTiketDateTimeChange:', index, range, startTime, endTime);
    const updated = [...tiketTersedia];
    updated[index] = { ...updated[index], selectedPeriode: range };
    
    // Reset error untuk tiket ini
    const newErrors = [...tiketErrors];
    newErrors[index] = '';
    
    // Validasi periode tiket
    if (range.from || range.to) {
      if (!eventDate?.from) {
        newErrors[index] = 'Pilih tanggal event terlebih dahulu';
      } else {
        const eventDateTime = new Date(eventDate.from);
        if (selectedTime) {
          eventDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        }
        
        // Validasi mulai jual
        if (range.from) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (range.from < today) {
            newErrors[index] = 'Tanggal mulai penjualan tidak boleh di masa lalu';
          }
          
          const maxStartDate = getMaxTicketSaleStartDate(eventDateTime);
          if (range.from > maxStartDate) {
            newErrors[index] = 'Penjualan tiket maksimal dimulai 6 bulan sebelum event';
          }
        }
        
        // Validasi akhir jual
        if (range.to) {
          if (range.to >= eventDateTime) {
            newErrors[index] = 'Penjualan tiket harus berakhir sebelum event dimulai';
          }
          
          if (range.from) {
            const durasi = range.to.getTime() - range.from.getTime();
            const satuHari = 24 * 60 * 60 * 1000;
            const satuTahun = 365 * 24 * 60 * 60 * 1000;
            
            if (durasi < satuHari) {
              newErrors[index] = 'Durasi penjualan minimal 1 hari';
            } else if (durasi > satuTahun) {
              newErrors[index] = 'Durasi penjualan maksimal 1 tahun';
            }
          }
        }
      }
    }
    
    // Gabungkan date range dengan startTime dan endTime untuk membuat datetime lengkap
    let mulaiJualISOString = '';
    let akhirJualISOString = '';
    
    if (range.from && startTime) {
      const mulaiJualDateTime = new Date(range.from);
      mulaiJualDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      mulaiJualISOString = mulaiJualDateTime.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    }
    
    if (range.to && endTime) {
      const akhirJualDateTime = new Date(range.to);
      akhirJualDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      akhirJualISOString = akhirJualDateTime.toISOString().slice(0, 16);
    }
    
    updated[index].mulaiJual = mulaiJualISOString;
    updated[index].akhirJual = akhirJualISOString;
    
    console.log('Updated tiket:', updated[index]);
    setTiketTersedia(updated);
    setTiketErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!authService.isMitra()) {
      setError('Hanya mitra yang dapat membuat event');
      return;
    }

    // === VALIDASI TANGGAL EVENT ===
    if (!eventDate?.from) {
      setError('Tanggal event wajib dipilih');
      return;
    }

    const now = new Date();
    const eventDateTime = new Date(eventDate.from);
    if (selectedTime) {
      eventDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    }

    // Event minimal 3 hari ke depan untuk persiapan
    const minEventDate = new Date(now);
    minEventDate.setDate(now.getDate() + 3);
    minEventDate.setHours(0, 0, 0, 0);

    if (eventDateTime < minEventDate) {
      setError('Tanggal event minimal 3 hari ke depan untuk persiapan yang cukup');
      return;
    }

    // Event maksimal 1 tahun ke depan
    const maxEventDate = new Date(now);
    maxEventDate.setFullYear(now.getFullYear() + 1);

    if (eventDateTime > maxEventDate) {
      setError('Tanggal event maksimal 1 tahun ke depan');
      return;
    }

    // === VALIDASI WAKTU EVENT ===
    if (!selectedTime) {
      setError('Waktu event wajib dipilih');
      return;
    }

    // Cek apakah ada error di periode tiket
    const hasTiketErrors = tiketErrors.some(error => error !== '');
    if (hasTiketErrors) {
      setError('Perbaiki kesalahan pada periode penjualan tiket terlebih dahulu');
      return;
    }

    for (let i = 0; i < tiketTersedia.length; i++) {
      const tiket = tiketTersedia[i];
      if (!tiket.nama || !tiket.harga || !tiket.stok) {
        setError(`Tipe tiket #${i + 1}: Nama, harga, dan stok wajib diisi`);
        return;
      }
      if (Number(tiket.harga) < 0) {
        setError(`Tipe tiket #${i + 1}: Harga tiket tidak boleh negatif`);
        return;
      }
      if (Number(tiket.stok) < 1) {
        setError(`Tipe tiket #${i + 1}: Stok minimal 1 tiket`);
        return;
      }
      if (tiket.maxPembelianPerOrang && Number(tiket.maxPembelianPerOrang) < 1) {
        setError(`Tipe tiket #${i + 1}: Maksimal pembelian per orang minimal 1`);
        return;
      }

      // === VALIDASI PERIODE PENJUALAN TIKET ===
      if (tiket.mulaiJual) {
        const mulaiJualDate = new Date(tiket.mulaiJual);
        
        // Mulai jual tidak boleh di masa lalu
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (mulaiJualDate < today) {
          setError(`Tipe tiket #${i + 1}: Tanggal mulai penjualan tidak boleh di masa lalu`);
          return;
        }

        // Mulai jual maksimal 6 bulan sebelum event
        const maxMulaiJual = new Date(eventDateTime);
        maxMulaiJual.setMonth(maxMulaiJual.getMonth() - 6);
        
        if (mulaiJualDate > maxMulaiJual) {
          setError(`Tipe tiket #${i + 1}: Penjualan tiket maksimal dimulai 6 bulan sebelum event`);
          return;
        }
      }

      if (tiket.akhirJual) {
        const akhirJualDate = new Date(tiket.akhirJual);
        
        // Akhir jual harus sebelum event dimulai
        if (akhirJualDate >= eventDateTime) {
          setError(`Tipe tiket #${i + 1}: Penjualan tiket harus berakhir sebelum event dimulai`);
          return;
        }

        // Minimal durasi penjualan 1 hari
        const mulaiJualDate = tiket.mulaiJual ? new Date(tiket.mulaiJual) : now;
        const durasiPenjualan = akhirJualDate.getTime() - mulaiJualDate.getTime();
        const satuHari = 24 * 60 * 60 * 1000; // milliseconds
        
        if (durasiPenjualan < satuHari) {
          setError(`Tipe tiket #${i + 1}: Durasi penjualan tiket minimal 1 hari`);
          return;
        }

        // Maksimal durasi penjualan 1 tahun
        const satuTahun = 365 * 24 * 60 * 60 * 1000;
        if (durasiPenjualan > satuTahun) {
          setError(`Tipe tiket #${i + 1}: Durasi penjualan tiket maksimal 1 tahun`);
          return;
        }
      }

      // Jika ada mulaiJual tapi tidak ada akhirJual, set akhirJual ke tanggal event
      if (tiket.mulaiJual && !tiket.akhirJual) {
        // Ini akan dihandle di backend, tapi kita bisa validasi di sini juga
      }
    }
    
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        tiketTersedia: tiketTersedia.map(t => ({
          nama: t.nama,
          harga: Number(t.harga),
          stok: Number(t.stok),
          deskripsi: t.deskripsi,
          maxPembelianPerOrang: t.maxPembelianPerOrang ? Number(t.maxPembelianPerOrang) : null,
          mulaiJual: t.mulaiJual || null,
          akhirJual: t.akhirJual || null
        }))
      };

      await api.post('/events', dataToSend);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat event';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-8 mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-blue-600 mb-1">Buat Event Baru</h1>
              <p className="text-gray-600 text-lg">Lengkapi formulir di bawah untuk membuat event Anda</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Informasi Dasar</p>
                  <p className="text-sm text-gray-500">Nama, deskripsi & kategori</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-lg">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Waktu & Lokasi</p>
                  <p className="text-sm text-gray-500">Jadwal & tempat event</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Tiket & Media</p>
                  <p className="text-sm text-gray-500">Harga, stok & gambar</p>
                </div>
              </div>
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
                      <h2 className="text-xl font-bold text-blue-600">Step 1: Informasi Dasar</h2>
                      <p className="text-sm text-blue-600/80">Berikan nama dan deskripsi menarik untuk event Anda</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Event *
                  </label>
                  <input
                    type="text"
                    name="nama"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="Contoh: Konser Musik Jazz 2025"
                    value={formData.nama}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi Event *
                  </label>
                  <textarea
                    name="deskripsi"
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Jelaskan secara detail tentang event Anda, apa yang membuat event ini menarik..."
                    value={formData.deskripsi}
                    onChange={handleChange}
                  />
                  <p className="mt-2 text-sm text-gray-500">Min. 20 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori Event *
                  </label>
                  <div className="relative">
                    <select
                      name="kategori"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 appearance-none bg-white"
                      value={formData.kategori}
                      onChange={handleChange}
                    >
                      {kategoriList.map((kat) => (
                        <option key={kat} value={kat}>
                          {kat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
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
                      <h2 className="text-xl font-bold text-yellow-600">Step 2: Waktu & Lokasi</h2>
                      <p className="text-sm text-yellow-600/80">Tentukan kapan dan di mana event akan berlangsung</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Tanggal Event *
                  </label>
                  <CalendarDatePicker
                    date={eventDate}
                    onDateSelect={handleEventDateSelect}
                    selectedTime={selectedTime || undefined}
                    onTimeSelect={handleTimeChange}
                    showTimeSelect={true}
                    numberOfMonths={1}
                    placeholder="Pilih tanggal dan waktu"
                    className="w-full"
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      • Minimal 3 hari ke depan untuk persiapan yang cukup
                    </p>
                    <p className="text-xs text-gray-500">
                      • Maksimal 1 tahun ke depan
                    </p>
                    {eventDate?.from && (
                      <p className="text-sm text-blue-600 font-medium">
                        ✓ {eventDate.from.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {selectedTime && ` pukul ${selectedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`}
                      </p>
                    )}
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
                        <h2 className="text-xl font-bold text-blue-600">Step 3: Tipe Tiket</h2>
                        <p className="text-sm text-blue-600/80">Tambahkan berbagai tipe tiket dengan harga berbeda</p>
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
                          🎫 Jumlah Tiket *
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
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 Periode Penjualan Tiket
                      </label>
                      <CalendarDatePicker
                        date={tiket.selectedPeriode}
                        onDateSelect={(range) => handleTiketDateTimeChange(index, range)}
                        ticketSaleMode={true}
                        startTime={startTime}
                        endTime={endTime}
                        onStartTimeSelect={setStartTime}
                        onEndTimeSelect={setEndTime}
                        numberOfMonths={2}
                        minDate={getMinTicketSaleDate()}
                        maxDate={eventDate?.from ? getMaxTicketSaleEndDate(eventDate.from) : undefined}
                        className="w-full"
                      />
                      <div className="grid md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            <strong>Waktu Mulai Penjualan:</strong>
                          </p>
                          <p className="text-xs text-gray-500">
                            {startTime 
                              ? `${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                              : 'Pilih waktu mulai'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            <strong>Periode Tanggal:</strong>
                          </p>
                          <p className="text-xs text-gray-500">
                            {tiket.selectedPeriode.from && tiket.selectedPeriode.to
                              ? `${tiket.selectedPeriode.from.toLocaleDateString('id-ID')} - ${tiket.selectedPeriode.to.toLocaleDateString('id-ID')}`
                              : 'Pilih periode tanggal'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            <strong>Waktu Selesai Penjualan:</strong>
                          </p>
                          <p className="text-xs text-gray-500">
                            {endTime 
                              ? `${endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                              : 'Pilih waktu selesai'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-amber-600">
                          • Minimal durasi penjualan: 1 hari
                        </p>
                        <p className="text-xs text-amber-600">
                          • Maksimal durasi penjualan: 1 tahun
                        </p>
                        <p className="text-xs text-amber-600">
                          • Penjualan harus berakhir sebelum event dimulai
                        </p>
                      </div>
                      {eventDate?.from && tiket.selectedPeriode.from && tiket.selectedPeriode.to && startTime && endTime && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700">
                            Durasi penjualan: {Math.ceil((tiket.selectedPeriode.to.getTime() - tiket.selectedPeriode.from.getTime()) / (1000 * 60 * 60 * 24))} hari
                          </p>
                          <p className="text-xs text-blue-700">
                            Waktu: {startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </div>
                      )}
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

                      {tiketErrors[index] && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {tiketErrors[index]}
                          </p>
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
                      <h2 className="text-xl font-bold text-yellow-600">Step 4: Gambar Event (Opsional)</h2>
                      <p className="text-sm text-yellow-600/80">Tambahkan gambar untuk menarik lebih banyak peserta</p>
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
                  <p className="mt-2 text-sm text-gray-500">Gambar akan ditampilkan sebagai thumbnail event</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-linear-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Menyimpan Event...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Publikasikan Event</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
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
                  Pastikan semua informasi sudah benar sebelum mempublikasikan
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
