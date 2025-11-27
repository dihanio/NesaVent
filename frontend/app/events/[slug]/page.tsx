'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import Link from 'next/link';

interface TicketType {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  stokTersisa: number;
  deskripsi?: string;
  maxPembelianPerOrang?: number | null;
  mulaiJual?: string | null;
  akhirJual?: string | null;
  allowedRoles?: string[];
}

interface Event {
  _id: string;
  nama: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  kategori: string;
  harga: number;
  stok: number;
  gambar: string;
  penyelenggara: string;
  createdBy: string;
  tiketTersedia?: TicketType[];
}

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [params.slug]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${params.slug}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatHarga = (harga: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(harga);
  };

  const getSelectedTicket = (ticketId: string) => {
    if (event?.tiketTersedia) {
      return event.tiketTersedia.find(t => t._id === ticketId);
    }
    return null;
  };

  const getCurrentPrice = () => {
    let total = 0;
    for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
      const ticket = getSelectedTicket(ticketId);
      if (ticket && quantity > 0) {
        total += ticket.harga * quantity;
      }
    }
    return total;
  };

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    const ticket = getSelectedTicket(ticketId);
    if (!ticket) return;

    const maxPurchase = ticket.maxPembelianPerOrang || 999;
    const newQuantity = Math.max(0, Math.min(quantity, maxPurchase));

    setSelectedTickets(prev => {
      const updated = { ...prev };
      if (newQuantity > 0) {
        updated[ticketId] = newQuantity;
      } else {
        delete updated[ticketId];
      }
      return updated;
    });
  };

  const isTicketAvailable = (ticket: TicketType) => {
    const now = new Date();

    if (ticket.mulaiJual) {
      const startDate = new Date(ticket.mulaiJual);
      if (now < startDate) return false;
    }

    if (ticket.akhirJual) {
      const endDate = new Date(ticket.akhirJual);
      if (now > endDate) return false;
    }

    return ticket.stokTersisa > 0;
  };

  const isUserAllowedToBuyTicket = (ticket: TicketType) => {
    if (!authService.isAuthenticated()) return true;

    const currentUser = authService.getCurrentUser();
    if (!currentUser) return true;

    if (!ticket.allowedRoles || ticket.allowedRoles.length === 0) return true;

    return ticket.allowedRoles.includes(currentUser.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!authService.isAuthenticated()) {
      router.push(`/login?redirect=/events/${params.slug}`);
      return;
    }

    if (authService.isMitraOrAdmin()) {
      const currentUser = authService.getCurrentUser();
      const roleText = currentUser?.role === 'mitra' ? 'mitra' : 'admin';
      setError(`Akun ${roleText} tidak dapat membeli tiket. Silakan gunakan akun regular untuk pembelian.`);
      return;
    }

    const totalQuantity = getTotalQuantity();
    if (totalQuantity <= 0) {
      setError('Silakan pilih minimal 1 tiket');
      return;
    }

    for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
      const ticket = getSelectedTicket(ticketId);
      if (!ticket || !isTicketAvailable(ticket)) {
        setError('Salah satu tiket yang dipilih tidak tersedia');
        return;
      }
      if (ticket.maxPembelianPerOrang && quantity > ticket.maxPembelianPerOrang) {
        setError(`Maksimal pembelian ${ticket.maxPembelianPerOrang} tiket per jenis`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const ticketSelections = Object.entries(selectedTickets).map(([ticketId, quantity]) => ({
        ticketTypeId: ticketId,
        quantity
      }));

      const orderData = {
        eventId: event!._id,
        ticketSelections,
      };

      const response = await api.post('/orders', orderData);
      router.push(`/checkout/${response.data._id}`);
    } catch (err: unknown) {
      console.error('Error submitting order:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat detail event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Event tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-8 pt-24">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-64 md:h-96 bg-gradient-to-r from-blue-600 to-blue-800">
            <img
              src={event.gambar}
              alt={event.nama}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/default-event.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-3">
                {event.kategori}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                {event.nama}
              </h1>
            </div>
          </div>

          <div className="lg:flex">
            {/* Main Content */}
            <div className="lg:w-2/3 p-6 md:p-8">
              {/* Event Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 text-blue-600 mb-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold">Tanggal</span>
                  </div>
                  <p className="text-lg font-extrabold text-gray-900">{formatTanggal(event.tanggal).split(',')[0]}</p>
                  <p className="text-sm text-gray-600">{formatTanggal(event.tanggal).split(',')[1]}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 text-purple-600 mb-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold">Waktu</span>
                  </div>
                  <p className="text-lg font-extrabold text-gray-900">{event.waktu}</p>
                  <p className="text-sm text-gray-600">WIB</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 md:col-span-1">
                  <div className="flex items-center gap-3 text-green-600 mb-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold">Lokasi</span>
                  </div>
                  <p className="text-lg font-extrabold text-gray-900 line-clamp-2">{event.lokasi}</p>
                  <p className="text-sm text-gray-600">📍 Venue</p>
                </div>
              </div>

              {/* Organizer */}
              <Link href={`/mitra/${event.createdBy.slug}`}>
                <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-center gap-3 hover:bg-gray-100 transition cursor-pointer">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {event.penyelenggara.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Diselenggarakan oleh</p>
                    <p className="font-bold text-gray-900">{event.penyelenggara}</p>
                  </div>
                </div>
              </Link>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                  Tentang Event
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {event.deskripsi}
                </p>
              </div>

              {/* Ticket Types Section */}
              {event.tiketTersedia && event.tiketTersedia.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Tipe Tiket Tersedia
                  </h3>
                  <div className="space-y-3">
                    {event.tiketTersedia.map((ticket) => {
                      const isAvailable = isTicketAvailable(ticket);
                      const isAllowed = isUserAllowedToBuyTicket(ticket);
                      const now = new Date();
                      let statusBadge = null;

                      if (ticket.mulaiJual && new Date(ticket.mulaiJual) > now) {
                        const startDate = new Date(ticket.mulaiJual);
                        statusBadge = (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Mulai {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        );
                      } else if (ticket.akhirJual && new Date(ticket.akhirJual) < now) {
                        statusBadge = (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Penjualan Berakhir
                          </span>
                        );
                      } else if (ticket.stokTersisa === 0) {
                        statusBadge = (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Habis
                          </span>
                        );
                      }

                      // Badge for restricted tickets
                      const restrictionBadge = ticket.allowedRoles && ticket.allowedRoles.length > 0 && ticket.allowedRoles.length < 4 ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                          🎓 Khusus {ticket.allowedRoles.map(r => r === 'mahasiswa' ? 'Mahasiswa' : r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                        </span>
                      ) : null;

                      return (
                        <div
                          key={ticket._id}
                          className={`p-4 rounded-xl border-2 transition-all ${!isAvailable || !isAllowed
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-bold text-gray-900">{ticket.nama}</h4>
                                {restrictionBadge}
                                {statusBadge}
                              </div>
                              {ticket.deskripsi && (
                                <p className="text-sm text-gray-600 mb-2">{ticket.deskripsi}</p>
                              )}
                              {!isAllowed && authService.isAuthenticated() && (
                                <p className="text-xs text-red-600 font-medium">
                                  ⚠️ Tiket ini tidak tersedia untuk akun Anda
                                </p>
                              )}
                              {ticket.maxPembelianPerOrang && (
                                <p className="text-xs text-gray-500">
                                  Maks. {ticket.maxPembelianPerOrang} tiket/orang
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold text-blue-600">
                                {ticket.harga > 0 ? formatHarga(ticket.harga) : 'Gratis'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Sisa: <span className="font-semibold">{ticket.stokTersisa}</span>
                              </p>
                            </div>
                          </div>

                          {isAvailable && isAllowed && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <span className="text-sm font-medium text-gray-700">Jumlah:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateTicketQuantity(ticket._id, (selectedTickets[ticket._id] || 0) - 1)}
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-bold transition"
                                  disabled={(selectedTickets[ticket._id] || 0) <= 0}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={ticket.maxPembelianPerOrang || 99}
                                  value={selectedTickets[ticket._id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const num = val === '' ? 0 : parseInt(val) || 0;
                                    updateTicketQuantity(ticket._id, num);
                                  }}
                                  className="w-16 text-center border border-gray-300 rounded-lg py-1 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateTicketQuantity(ticket._id, (selectedTickets[ticket._id] || 0) + 1)}
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-bold transition"
                                  disabled={(selectedTickets[ticket._id] || 0) >= (ticket.maxPembelianPerOrang || 99)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / Checkout Summary */}
            <div className="lg:w-1/3 p-6 md:p-8 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ringkasan Pesanan</h3>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                  {Object.keys(selectedTickets).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada tiket yang dipilih</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                        const ticket = getSelectedTicket(ticketId);
                        if (!ticket) return null;
                        return (
                          <div key={ticketId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{quantity}x {ticket.nama}</span>
                            <span className="font-semibold">{formatHarga(ticket.harga * quantity)}</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-blue-600">{formatHarga(getCurrentPrice())}</span>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={getTotalQuantity() === 0 || submitting}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform hover:-translate-y-1 ${getTotalQuantity() > 0 && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {submitting ? 'Memproses...' : 'Beli Tiket Sekarang'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Dengan membeli tiket, Anda menyetujui syarat & ketentuan yang berlaku.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
