'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface TicketType {
    _id: string;
    nama: string;
    harga: number;
    stok: number;
    stokTersisa: number;
    deskripsi?: string;
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
    slug: string;
}

export default function RecommendationsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            // Untuk sementara, ambil event terbaru sebagai rekomendasi
            // Nanti bisa dikembangkan dengan algoritma berdasarkan preferensi user
            const response = await api.get('/events?limit=12&sort=-createdAt');
            setEvents(response.data.events || response.data);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat rekomendasi...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-purple-100">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600">Rekomendasi untuk Anda</h1>
                    </div>
                    <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">
                        Event menarik yang mungkin Anda sukai berdasarkan preferensi Anda
                    </p>
                </div>

                {/* Events Grid */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
                    {events.length > 0 ? (
                        <div className="p-4 md:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {events.map((event) => (
                                    <EventCard key={event._id} event={event} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Rekomendasi</h3>
                            <p className="text-gray-600 text-base max-w-md mx-auto mb-6">
                                Kami sedang menyiapkan rekomendasi event yang sesuai dengan minat Anda.
                            </p>
                            <button
                                onClick={() => router.push('/events')}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
                            >
                                Jelajahi Semua Event
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}