'use client';

import Link from 'next/link';
import { formatHarga, formatTanggal } from '@/lib/formatters';

interface MitraDashboardHomeProps {
    stats: any;
    events: any[];
    filterStatus: string;
    setFilterStatus: (status: any) => void;
    sortBy: string;
    setSortBy: (sort: any) => void;
    sortDirection: string;
    handleSort: (column: any) => void;
}

export default function MitraDashboardHome({
    stats,
    events,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortDirection,
    handleSort,
}: MitraDashboardHomeProps) {

    // Filter and sort events
    const filteredAndSortedEvents = events
        .filter(event => filterStatus === 'all' || event.status === filterStatus)
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'tanggal') {
                comparison = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
            } else if (sortBy === 'nama') {
                comparison = a.nama.localeCompare(b.nama);
            } else {
                comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    return (
        <div>
            {/* Header */}
            <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-blue-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Dashboard Mitra</h1>
                        </div>
                        <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola event dan pantau performa bisnis Anda</p>
                    </div>
                    <Link
                        href="/dashboard/events/create"
                        className="w-full md:w-auto bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold text-sm md:text-base"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Event Baru
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Event</p>
                    <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.totalEvents}</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-2">Semua event yang dibuat</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Event Aktif</p>
                    <p className="text-4xl font-bold text-green-600">{stats.activeEvents}</p>
                    <p className="text-sm text-gray-400 mt-2">Sedang berlangsung</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Tiket Terjual</p>
                    <p className="text-4xl font-bold text-yellow-600">{stats.totalTicketsSold}</p>
                    <p className="text-sm text-gray-400 mt-2">Total penjualan tiket</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Pendapatan</p>
                    <p className="text-3xl font-bold text-blue-600">{formatHarga(stats.totalRevenue)}</p>
                    <p className="text-sm text-gray-400 mt-2">Revenue dari tiket</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <Link
                    href="/dashboard/events/create"
                    className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-100 group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Buat Event Baru</h3>
                            <p className="text-sm text-gray-500">Mulai membuat event dan jangkau lebih banyak peserta</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>

                <Link
                    href="/dashboard/events"
                    className="bg-white rounded-2xl shadow-md p-6 border-2 border-yellow-100 group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">Kelola Event</h3>
                            <p className="text-sm text-gray-500">Edit, update, dan kelola semua event Anda</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>

                <div className="bg-linear-to-br from-blue-50 to-yellow-50 rounded-2xl shadow-md p-6 border-2 border-blue-100">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Tips & Panduan</h3>
                            <p className="text-sm text-gray-600">Event dengan gambar menarik mendapat 3x lebih banyak peserta!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Sort */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-2 border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="w-full lg:w-auto">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Filter & Urutkan</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
                            {[
                                { label: 'Semua', value: 'all' as const },
                                { label: 'Draft', value: 'draft' as const },
                                { label: 'Pending', value: 'pending' as const },
                                { label: 'Aktif', value: 'aktif' as const },
                                { label: 'Ditolak', value: 'ditolak' as const },
                                { label: 'Selesai', value: 'selesai' as const },
                                { label: 'Dibatalkan', value: 'dibatalkan' as const },
                            ].map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setFilterStatus(filter.value)}
                                    className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${filterStatus === filter.value
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {filter.label}
                                    {filter.value !== 'all' && (
                                        <span className="ml-2 text-xs opacity-75">
                                            ({events.filter(e => e.status === filter.value).length})
                                        </span>
                                    )}
                                    {filter.value === 'all' && (
                                        <span className="ml-2 text-xs opacity-75">
                                            ({events.length})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Urutkan Berdasarkan
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 font-medium bg-white"
                        >
                            <option value="terbaru">Terbaru Dibuat</option>
                            <option value="tanggal">Tanggal Event</option>
                            <option value="nama">Nama (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
                <div className="px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-blue-50 to-yellow-50 border-b-2 border-blue-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg md:text-2xl font-bold text-blue-600">Daftar Event</h2>
                                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Semua event yang Anda kelola</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/events"
                            className="text-blue-600 hover:text-blue-700 font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 hover:gap-2 md:hover:gap-3 transition-all"
                        >
                            Lihat Semua
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {filteredAndSortedEvents.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-50">
                                    <tr>
                                        <th
                                            onClick={() => handleSort('nama')}
                                            className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Nama Event</span>
                                                <div className="flex flex-col">
                                                    <svg className={`w-3 h-3 -mb-1 ${sortBy === 'nama' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <svg className={`w-3 h-3 ${sortBy === 'nama' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('tanggal')}
                                            className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Tanggal</span>
                                                <div className="flex flex-col">
                                                    <svg className={`w-3 h-3 -mb-1 ${sortBy === 'tanggal' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <svg className={`w-3 h-3 ${sortBy === 'tanggal' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Lokasi
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Harga
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Stok
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredAndSortedEvents.map((event) => (
                                        <tr key={event._id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {event.gambar ? (
                                                        <img
                                                            src={event.gambar}
                                                            alt={event.nama}
                                                            className="w-16 h-16 rounded-xl object-cover shadow-md border-2 border-blue-100"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-yellow-100 rounded-xl flex items-center justify-center shrink-0 border-2 border-blue-100 shadow-md">
                                                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 mb-1">{event.nama}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                            </svg>
                                                            {event.kategori}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{formatTanggal(event.tanggal)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 max-w-xs truncate">{event.lokasi}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-blue-600">
                                                    {event.harga === 0 ? 'Gratis' : formatHarga(event.harga)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {event.stok} <span className="text-gray-500 font-normal">tiket</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${event.status === 'aktif' ? 'bg-green-100 text-green-800' :
                                                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}>
                                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/dashboard/events/${event.slug}/edit`}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <Link
                                                        href={`/events/${event.slug}`}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition"
                                                        title="Lihat"
                                                        target="_blank"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden grid grid-cols-1 gap-4">
                            {filteredAndSortedEvents.map((event) => (
                                <div key={event._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex gap-4">
                                        {event.gambar ? (
                                            <img
                                                src={event.gambar}
                                                alt={event.nama}
                                                className="w-20 h-20 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-gray-900 truncate pr-2">{event.nama}</h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${event.status === 'aktif' ? 'bg-green-100 text-green-800' :
                                                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{formatTanggal(event.tanggal)}</p>
                                            <p className="text-sm font-bold text-blue-600 mt-1">
                                                {event.harga === 0 ? 'Gratis' : formatHarga(event.harga)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-gray-50">
                                        <Link
                                            href={`/dashboard/events/${event.slug}/edit`}
                                            className="text-sm text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-lg"
                                        >
                                            Edit
                                        </Link>
                                        <Link
                                            href={`/events/${event.slug}`}
                                            className="text-sm text-green-600 font-medium px-3 py-1.5 bg-green-50 rounded-lg"
                                        >
                                            Lihat
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Belum ada event</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">Mulai buat event pertama Anda dan jangkau ribuan peserta potensial di platform kami.</p>
                        <Link
                            href="/dashboard/events/create"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Event Sekarang
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
