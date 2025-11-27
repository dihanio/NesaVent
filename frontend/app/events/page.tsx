'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';
import api from '@/lib/api';

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
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    hasMore: boolean;
}

function EventsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Filter states
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [kategori, setKategori] = useState(searchParams.get('kategori') || 'Semua');
    const [sort, setSort] = useState(searchParams.get('sort') || 'upcoming');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

    const kategoriList = [
        'Semua',
        'Musik',
        'Olahraga',
        'Seminar',
        'Workshop',
        'Festival',
        'Lainnya',
    ];

    useEffect(() => {
        fetchEvents();
        // Update URL params without reloading
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (kategori !== 'Semua') params.set('kategori', kategori);
        if (sort !== 'upcoming') params.set('sort', sort);
        if (page > 1) params.set('page', page.toString());

        router.push(`/events?${params.toString()}`, { scroll: false });
    }, [search, kategori, sort, page]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params: any = {
                page,
                limit: 9, // 9 items per page
                sort
            };

            if (kategori !== 'Semua') params.kategori = kategori;
            if (search) params.search = search;

            const response = await api.get('/events', { params });

            // Handle response format
            const data = response.data.data || response.data;
            const meta = response.data.pagination;

            setEvents(Array.isArray(data) ? data : []);
            setPagination(meta || null);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && (!pagination || newPage <= pagination.pages)) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 pt-24">
            <div className="container mx-auto px-4">
                {/* Header & Filters */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Jelajahi Semua Event</h1>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari event..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1); // Reset page on search
                                }}
                            />
                            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            {/* Categories */}
                            <div className="flex flex-wrap gap-2">
                                {kategoriList.map((kat) => (
                                    <button
                                        key={kat}
                                        onClick={() => {
                                            setKategori(kat);
                                            setPage(1);
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${kategori === kat
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {kat}
                                    </button>
                                ))}
                            </div>

                            {/* Sort */}
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value);
                                    setPage(1);
                                }}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="upcoming">📅 Terdekat</option>
                                <option value="newest">✨ Terbaru</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Event Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : events.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                            {events.map((event) => (
                                <EventCard key={event._id} event={event} />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex justify-center items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        className={`w-10 h-10 rounded-lg font-semibold transition ${page === p
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === pagination.pages}
                                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Event Ditemukan</h3>
                        <p className="text-gray-600 mb-6">
                            Coba ubah kata kunci pencarian atau filter kategori Anda.
                        </p>
                        <button
                            onClick={() => {
                                setSearch('');
                                setKategori('Semua');
                                setPage(1);
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            Reset Filter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EventsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <EventsContent />
        </Suspense>
    );
}
