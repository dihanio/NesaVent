'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import EventCard from '@/components/EventCard';
import api from '@/lib/api';
import { CalendarDatePicker } from '@/components/calendar-date-picker';

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
    slug: string;
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
    const [lokasi, setLokasi] = useState(searchParams.get('lokasi') || '');
    const [hargaMin, setHargaMin] = useState(searchParams.get('hargaMin') || '');
    const [hargaMax, setHargaMax] = useState(searchParams.get('hargaMax') || '');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const mulai = searchParams.get('tanggalMulai');
        const akhir = searchParams.get('tanggalAkhir');
        if (mulai || akhir) {
            return {
                from: mulai ? new Date(mulai) : undefined,
                to: akhir ? new Date(akhir) : undefined
            };
        }
        return undefined;
    });
    const [khususMahasiswa, setKhususMahasiswa] = useState(searchParams.get('khususMahasiswa') === 'true');
    const [gratis, setGratis] = useState(searchParams.get('gratis') === 'true');
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
        if (lokasi) params.set('lokasi', lokasi);
        if (hargaMin) params.set('hargaMin', hargaMin);
        if (hargaMax) params.set('hargaMax', hargaMax);
        if (dateRange?.from) params.set('tanggalMulai', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange?.to) params.set('tanggalAkhir', format(dateRange.to, 'yyyy-MM-dd'));
        if (khususMahasiswa) params.set('khususMahasiswa', 'true');
        if (gratis) params.set('gratis', 'true');
        if (page > 1) params.set('page', page.toString());

        router.push(`/events?${params.toString()}`, { scroll: false });
    }, [search, kategori, sort, lokasi, hargaMin, hargaMax, dateRange, khususMahasiswa, gratis, page]);

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
            if (lokasi) params.lokasi = lokasi;
            if (hargaMin) params.hargaMin = hargaMin;
            if (hargaMax) params.hargaMax = hargaMax;
            if (dateRange?.from) params.tanggalMulai = format(dateRange.from, 'yyyy-MM-dd');
            if (dateRange?.to) params.tanggalAkhir = format(dateRange.to, 'yyyy-MM-dd');
            if (khususMahasiswa) params.khususMahasiswa = true;
            if (gratis) params.gratis = true;

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
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Jelajahi Semua Event</h1>

                {/* Sidebar + Content Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - Filters */}
                    <div className="lg:w-80 shrink-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24 space-y-6">
                            {/* Search Box */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cari Event</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari event..."
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Kategori</label>
                                <div className="space-y-2">
                                    {kategoriList.map((kat) => (
                                        <button
                                            key={kat}
                                            onClick={() => {
                                                setKategori(kat);
                                                setPage(1);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition ${kategori === kat
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {kat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Urutkan</label>
                                <select
                                    value={sort}
                                    onChange={(e) => {
                                        setSort(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="upcoming">📅 Terdekat</option>
                                    <option value="newest">✨ Terbaru</option>
                                    <option value="price-low">💰 Harga Termurah</option>
                                    <option value="price-high">💎 Harga Termahal</option>
                                </select>
                            </div>

                            {/* Lokasi */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Lokasi</label>
                                <input
                                    type="text"
                                    placeholder="Cari lokasi..."
                                    value={lokasi}
                                    onChange={(e) => {
                                        setLokasi(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Rentang Harga */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Rentang Harga</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={hargaMin}
                                        onChange={(e) => {
                                            setHargaMin(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={hargaMax}
                                        onChange={(e) => {
                                            setHargaMax(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Rentang Tanggal */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📆 Rentang Tanggal</label>
                                <div className="space-y-2">
                                    {/* Tanggal Mulai */}
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
                                        <CalendarDatePicker
                                            date={dateRange?.from ? { from: dateRange.from, to: dateRange.from } : undefined}
                                            onDateSelect={(range) => {
                                                setDateRange(prev => ({
                                                    from: range.from,
                                                    to: prev?.to
                                                }));
                                                setPage(1);
                                            }}
                                            numberOfMonths={1}
                                            placeholder="Pilih tanggal mulai"
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal text-sm h-10"
                                        />
                                    </div>
                                    
                                    {/* Tanggal Akhir */}
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
                                        <CalendarDatePicker
                                            date={dateRange?.to ? { from: dateRange.to, to: dateRange.to } : undefined}
                                            onDateSelect={(range) => {
                                                setDateRange(prev => ({
                                                    from: prev?.from,
                                                    to: range.from
                                                }));
                                                setPage(1);
                                            }}
                                            numberOfMonths={1}
                                            placeholder="Pilih tanggal akhir"
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal text-sm h-10"
                                            minDate={dateRange?.from}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Khusus Mahasiswa Checkbox */}
                            <div className="pt-2 border-t border-gray-200 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={khususMahasiswa}
                                            onChange={(e) => {
                                                setKhususMahasiswa(e.target.checked);
                                                setPage(1);
                                            }}
                                            className="peer w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                                        />
                                        <svg className="absolute inset-0 w-5 h-5 text-white pointer-events-none hidden peer-checked:block" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition">🎓 Event Khusus Mahasiswa</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={gratis}
                                            onChange={(e) => {
                                                setGratis(e.target.checked);
                                                setPage(1);
                                            }}
                                            className="peer w-5 h-5 rounded border-2 border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                                        />
                                        <svg className="absolute inset-0 w-5 h-5 text-white pointer-events-none hidden peer-checked:block" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition">🆓 Event Gratis</span>
                                    </div>
                                </label>
                            </div>

                            {/* Reset Button */}
                            {(search || kategori !== 'Semua' || sort !== 'upcoming' || lokasi || hargaMin || hargaMax || dateRange || khususMahasiswa || gratis) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setKategori('Semua');
                                        setSort('upcoming');
                                        setLokasi('');
                                        setHargaMin('');
                                        setHargaMax('');
                                        setDateRange(undefined);
                                        setKhususMahasiswa(false);
                                        setGratis(false);
                                        setPage(1);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold text-sm"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Content - Event Cards */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : events.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
                                        setSort('upcoming');
                                        setLokasi('');
                                        setHargaMin('');
                                        setHargaMax('');
                                        setDateRange(undefined);
                                        setKhususMahasiswa(false);
                                        setGratis(false);
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
