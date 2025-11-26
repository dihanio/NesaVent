'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TicketCard from '@/components/TicketCard';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

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
  const [filter, setFilter] = useState<'semua' | 'aktif' | 'terpakai'>('semua');

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
    if (filter === 'semua') return true;
    return ticket.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tiket Saya
          </h1>
          <p className="text-gray-600">
            Kelola dan lihat semua tiket event Anda
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('semua')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'semua'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('aktif')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'aktif'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilter('terpakai')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'terpakai'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Terpakai
          </button>
        </div>

        {/* Tickets */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat tiket...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-4">
              {filter === 'semua'
                ? 'Anda belum memiliki tiket'
                : `Tidak ada tiket dengan status ${filter}`}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Jelajahi Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
