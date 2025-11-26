'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

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
  tiketTersedia?: TicketType[];
  totalStokTersisa?: number;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  // Removed auto-select useEffect to allow manual selection of multiple ticket types

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${params.id}`);
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

    // Hanya batasi berdasarkan max per orang, bukan stok (stok dicek di payment)
    const maxPurchase = ticket.maxPembelianPerOrang || 999; // Large number if no limit
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
    
    // Check if sale period has started
    if (ticket.mulaiJual) {
      const startDate = new Date(ticket.mulaiJual);
      if (now < startDate) return false;
    }
    
    // Check if sale period has ended
    if (ticket.akhirJual) {
      const endDate = new Date(ticket.akhirJual);
      if (now > endDate) return false;
    }
    
    return ticket.stokTersisa > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!authService.isAuthenticated()) {
      router.push(`/login?redirect=/events/${params.id}`);
      return;
    }

    // Check if user is mitra or admin - they cannot purchase tickets
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

    // Check each selected ticket
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

      console.log('Submitting order with selectedTickets:', selectedTickets);
      console.log('ticketSelections:', ticketSelections);

      const orderData = {
        eventId: event!._id,
        ticketSelections,
      };

      console.log('orderData:', orderData);

      const response = await api.post('/orders', orderData);
      // Redirect ke halaman checkout
      router.push(`/checkout/${response.data._id}`);
    } catch (err: unknown) {
      console.error('Error submitting order:', err);
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Error response:', error.response);
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-gray-100 py-8">
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
          <div className="relative h-64 md:h-96 bg-linear-to-r from-blue-600 to-blue-800">
            <img
              src={event.gambar}
              alt={event.nama}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/default-event.jpg';
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
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
                <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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

                <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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

                <div className="bg-linear-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 md:col-span-1">
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
              <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {event.penyelenggara.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Diselenggarakan oleh</p>
                  <p className="font-bold text-gray-900">{event.penyelenggara}</p>
                </div>
              </div>

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
                      
                      return (
                        <div
                          key={ticket._id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            !isAvailable
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-bold text-gray-900">{ticket.nama}</h4>
                                {statusBadge}
                              </div>
                              {ticket.deskripsi && (
                                <p className="text-sm text-gray-600 mb-2">{ticket.deskripsi}</p>
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
                          
                          {isAvailable && (
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
                                  className="w-16 text-center px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateTicketQuantity(ticket._id, (selectedTickets[ticket._id] || 0) + 1)}
                                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold transition"
                                  disabled={!!(ticket.maxPembelianPerOrang && (selectedTickets[ticket._id] || 0) >= ticket.maxPembelianPerOrang)}
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

            {/* Sidebar - Order Form */}
            <div className="lg:w-1/3 bg-gray-50 p-6 md:p-8 border-l">
              <div className="sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                  Beli Tiket
                </h2>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Info: Login required */}
                  {!authService.isAuthenticated() && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold mb-1">Login Diperlukan</p>
                          <p>Anda perlu login terlebih dahulu untuk membeli tiket. Klik tombol bayar untuk melanjutkan.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info: Mitra cannot purchase */}
                  {authService.isAuthenticated() && authService.isMitraOrAdmin() && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-orange-800">
                          <p className="font-semibold mb-1">Pembelian Tidak Diperbolehkan</p>
                          <p>Akun {authService.getCurrentUser()?.role === 'mitra' ? 'mitra' : 'admin'} tidak dapat membeli tiket. Fitur ini hanya untuk pengguna regular.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3">Ringkasan Pembayaran</h3>
                    <div className="space-y-2 mb-3">
                      {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                        const ticket = getSelectedTicket(ticketId);
                        if (!ticket || quantity <= 0) return null;
                        return (
                          <div key={ticketId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{ticket.nama} × {quantity}</span>
                            <span className="font-semibold text-gray-900">{formatHarga(ticket.harga * quantity)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total Bayar</span>
                      <span className="text-2xl font-extrabold text-blue-600">
                        {formatHarga(getCurrentPrice())}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || getTotalQuantity() === 0 || (authService.isAuthenticated() && authService.isMitraOrAdmin())}
                    className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                      </span>
                    ) : getTotalQuantity() === 0 ? (
                      '❌ Pilih Tiket'
                    ) : authService.isAuthenticated() && authService.isMitraOrAdmin() ? (
                      `🚫 ${authService.getCurrentUser()?.role === 'mitra' ? 'Mitra' : 'Admin'} Tidak Dapat Membeli`
                    ) : authService.isAuthenticated() ? (
                      '🎫 Lanjutkan Pembayaran'
                    ) : (
                      '🔐 Login & Lanjutkan Pembayaran'
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    Dengan melanjutkan, Anda menyetujui syarat & ketentuan kami
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Harga ({getTotalQuantity()} tiket)</p>
              <p className="text-xl font-bold text-blue-600">
                {formatHarga(getCurrentPrice())}
              </p>
            </div>
            <button
              onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
            >
              Beli Tiket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
