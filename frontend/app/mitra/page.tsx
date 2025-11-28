'use client';

import { useEffect, useState } from 'react';
import MitraCard from '@/components/MitraCard';
import api from '@/lib/api';

interface Mitra {
    _id: string;
    nama: string;
    organisasi: string;
    avatar: string;
    slug: string;
    bio?: string;
}

export default function MitraPage() {
    const [mitras, setMitras] = useState<Mitra[]>([]);
    const [filteredMitras, setFilteredMitras] = useState<Mitra[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMitras();
    }, []);

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredMitras(mitras);
        } else {
            const filtered = mitras.filter(
                (mitra) =>
                    mitra.nama.toLowerCase().includes(search.toLowerCase()) ||
                    mitra.organisasi.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredMitras(filtered);
        }
    }, [search, mitras]);

    const fetchMitras = async () => {
        try {
            setLoading(true);
            const response = await api.get('/mitra');
            const data = response.data.data || response.data;
            setMitras(Array.isArray(data) ? data : []);
            setFilteredMitras(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching mitra:', error);
            setMitras([]);
            setFilteredMitras([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 pt-24">
            <div className="container mx-auto px-4">
                {/* Header & Filters */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Jelajahi Semua Mitra</h1>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari mitra atau organisasi..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Mitra Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredMitras.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                            {filteredMitras.map((mitra) => (
                                <MitraCard key={mitra._id} mitra={mitra} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Mitra Ditemukan</h3>
                        <p className="text-gray-600 mb-6">
                            {search
                                ? `Tidak ada mitra yang cocok dengan pencarian "${search}"`
                                : 'Belum ada mitra yang terdaftar saat ini.'}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                            >
                                Reset Pencarian
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

