'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TicketCard from '@/components/TicketCard';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface Ticket {
  _id: string;
  kodeTicket: string;
  qrCode: string;
  namaPemilik: string;
  status: 'aktif' | 'terpakai' | 'expired';
  event: {
    _id: string;
    nama: string;
    tanggal: string;
    waktu: string;
    lokasi: string;
  };
  createdAt: string;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'semua' | 'aktif' | 'terpakai' | 'expired'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets/my-tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === 'semua' || ticket.status === filter;
    const matchesSearch = searchQuery === '' ||
      ticket.event.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.namaPemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.kodeTicket.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    aktif: tickets.filter(t => t.status === 'aktif').length,
    terpakai: tickets.filter(t => t.status === 'terpakai').length,
    expired: tickets.filter(t => t.status === 'expired').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat tiket...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Tiket Saya</h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola dan lihat semua tiket event Anda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Tiket</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Aktif</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.aktif}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Terpakai</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-600">{stats.terpakai}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-red-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Kadaluarsa</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.expired}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6 border-2 border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Cari Tiket</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama event, pemilik, atau kode tiket..."
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Filter Status</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { label: 'Semua', value: 'semua' as const },
                  { label: 'Aktif', value: 'aktif' as const },
                  { label: 'Terpakai', value: 'terpakai' as const },
                  { label: 'Kadaluarsa', value: 'expired' as const },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                      filter === tab.value
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Grid/Cards */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
          {filteredTickets.length > 0 ? (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredTickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Tiket</h3>
              <p className="text-gray-600 text-base max-w-md mx-auto mb-6">
                {filter === 'semua' && searchQuery === ''
                  ? 'Anda belum memiliki tiket event.'
                  : 'Tidak ada tiket yang sesuai dengan filter.'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Jelajahi Event
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}