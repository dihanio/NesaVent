'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TicketCard from '@/components/TicketCard';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
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

export default function DashboardTicketsPage() {
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
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-blue-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                        <div>
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
                        <button
                            onClick={() => router.push('/events')}
                            className="w-full md:w-auto bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold text-sm md:text-base"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Cari Event Baru
                        </button>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-2 border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Filter Tiket</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('semua')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'semua'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setFilter('aktif')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'aktif'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Aktif
                            </button>
                            <button
                                onClick={() => setFilter('terpakai')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'terpakai'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Terpakai
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tickets Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Memuat tiket...</p>
                        </div>
                    </div>
                ) : filteredTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.map((ticket) => (
                            <TicketCard key={ticket._id} ticket={ticket} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {filter === 'semua' ? 'Belum ada tiket' : `Tidak ada tiket ${filter}`}
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            {filter === 'semua'
                                ? 'Anda belum membeli tiket apapun. Cari event menarik dan beli tiketnya sekarang!'
                                : `Anda tidak memiliki tiket dengan status ${filter}.`}
                        </p>
                        <button
                            onClick={() => router.push('/events')}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
                        >
                            Cari Event
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
