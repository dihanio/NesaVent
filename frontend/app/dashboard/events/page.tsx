'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal, formatHarga } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface TicketType {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  stokTersisa: number;
  deskripsi: string;
}

interface Event {
  _id: string;
  nama: string;
  slug: string;
  tanggal: string;
  lokasi: string;
  kategori: string;
  harga?: number;
  stok?: number;
  tiketTersedia?: TicketType[];
  totalStok?: number;
  totalStokTersisa?: number;
  status: 'draft' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan' | 'ditolak';
  gambar?: string;
  createdAt: string;
  alasanDitolak?: string;
  isVerified?: boolean;
}

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan' | 'ditolak'>('all');
  const [sortBy, setSortBy] = useState<'tanggal' | 'nama' | 'terbaru'>('terbaru');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!authService.isMitra()) {
      router.push('/');
      return;
    }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (slug: string) => {
    if (!confirm('Yakin ingin menghapus event ini?')) return;

    try {
      await api.delete(`/events/${slug}`);
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus event');
    }
  };

  const handleSubmitEvent = async (slug: string) => {
    if (!confirm('Ajukan event ini untuk verifikasi admin?')) return;

    try {
      const response = await api.put(`/admin/events/${slug}/submit`);
      alert(response.data.message);
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengajukan event');
    }
  };

  const filteredAndSortedEvents = (filter === 'all' 
    ? events 
    : events.filter(e => e.status === filter)
  ).sort((a, b) => {
    if (sortBy === 'tanggal') {
      return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    } else if (sortBy === 'nama') {
      return a.nama.localeCompare(b.nama);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat daftar event...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-8 mb-8 border-2 border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-blue-600">Daftar Event</h1>
              </div>
              <p className="text-gray-600 text-lg ml-15">Kelola semua event yang Anda buat dengan mudah</p>
            </div>
            <Link
              href="/dashboard/events/create"
              className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Event Baru
            </Link>
          </div>
        </div>

        {/* Filter & Sort */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6 md:mb-8 border-2 border-blue-100">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start lg:items-center justify-between">
            {/* Filter Status */}
            <div className="flex flex-col gap-2 md:gap-3 w-full lg:w-auto">
              <label className="text-xs md:text-sm font-semibold text-gray-700">Filter Status:</label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                {[
                  { label: 'Semua', value: 'all' as const, count: events.length },
                  { label: 'Draft', value: 'draft' as const, count: events.filter(e => e.status === 'draft').length },
                  { label: 'Pending', value: 'pending' as const, count: events.filter(e => e.status === 'pending').length },
                  { label: 'Aktif', value: 'aktif' as const, count: events.filter(e => e.status === 'aktif').length },
                  { label: 'Ditolak', value: 'ditolak' as const, count: events.filter(e => e.status === 'ditolak').length },
                  { label: 'Selesai', value: 'selesai' as const, count: events.filter(e => e.status === 'selesai').length },
                  { label: 'Dibatalkan', value: 'dibatalkan' as const, count: events.filter(e => e.status === 'dibatalkan').length },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 text-sm ${
                      filter === tab.value
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                    <span className="px-1.5 md:px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex flex-col gap-2 md:gap-3 w-full lg:w-auto">
              <label className="text-xs md:text-sm font-semibold text-gray-700">Urutkan:</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border-2 border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition appearance-none cursor-pointer text-sm"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="tanggal">Tanggal Event</option>
                  <option value="nama">Nama A-Z</option>
                </select>
                <svg className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredAndSortedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-blue-100 hover:shadow-xl transition group"
              >
                {/* Event Image */}
                <div className="relative h-48 bg-yellow-100 overflow-hidden">
                  {event.gambar ? (
                    <img
                      src={event.gambar}
                      alt={event.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                      event.status === 'aktif' 
                        ? 'bg-green-500 text-white' 
                        : event.status === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : event.status === 'draft'
                        ? 'bg-blue-500 text-white'
                        : event.status === 'ditolak'
                        ? 'bg-red-500 text-white'
                        : event.status === 'selesai'
                        ? 'bg-gray-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.nama}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatTanggal(event.tanggal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{event.lokasi}</span>
                    </div>
                    {event.tiketTersedia && event.tiketTersedia.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <span className="font-semibold text-yellow-600">
                            {event.tiketTersedia.length} Tipe Tiket
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-blue-600">
                            {formatHarga(Math.min(...event.tiketTersedia.map(t => t.harga)))} - {formatHarga(Math.max(...event.tiketTersedia.map(t => t.harga)))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Total: <span className="font-semibold">{event.totalStok || event.tiketTersedia.reduce((sum, t) => sum + t.stok, 0)}</span> tiket</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <span className="font-semibold text-yellow-600">{formatHarga(event.harga || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Stok: <span className="font-semibold">{event.stok || 0}</span> tiket</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Alasan Ditolak */}
                  {event.status === 'ditolak' && event.alasanDitolak && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs font-bold text-red-700 mb-1">Alasan Ditolak:</p>
                          <p className="text-xs text-red-600">{event.alasanDitolak}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitEvent(event.slug)}
                        className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ajukan untuk Verifikasi
                      </button>
                    )}
                    <div className="flex gap-2">
                      {(event.status === 'draft' || event.status === 'ditolak') && (
                        <Link
                          href={`/dashboard/events/edit/${event.slug}`}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition text-center font-medium text-sm"
                        >
                          Edit
                        </Link>
                      )}
                      {(event.status === 'aktif' || event.status === 'pending') && (
                        <Link
                          href={`/dashboard/events/analytics/${event.slug}`}
                          className="flex-1 bg-yellow-100 text-yellow-700 py-2 px-3 rounded-lg hover:bg-yellow-200 transition text-center font-medium text-sm"
                        >
                          Analytics
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(event.slug)}
                        className="bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition font-medium text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-blue-100">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'Belum ada event' : `Tidak ada event ${filter}`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Mulai buat event pertama Anda untuk menjangkau lebih banyak peserta'
                : 'Coba filter kategori lain atau buat event baru'
              }
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard/events/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Event Pertama
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
