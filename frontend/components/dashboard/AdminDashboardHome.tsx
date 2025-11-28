'use client';

import Link from 'next/link';
import { formatHarga } from '@/lib/formatters';

interface AdminDashboardHomeProps {
    stats: any;
}

export default function AdminDashboardHome({ stats }: AdminDashboardHomeProps) {
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
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Dashboard Admin</h1>
                        </div>
                        <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Pantau performa platform dan kelola konten</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Pengguna</p>
                    <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-2">Terdaftar di platform</p>
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

            {/* Admin Management Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                {/* User Management Overview */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Manajemen Pengguna</h3>
                            <p className="text-sm text-gray-600">Kelola pengguna platform</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Total Pengguna</span>
                            <span className="text-lg font-bold text-blue-600">{stats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Mitra Aktif</span>
                            <span className="text-lg font-bold text-green-600">{stats.activeMitra}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Pengguna Baru (Bulan Ini)</span>
                            <span className="text-lg font-bold text-yellow-600">{stats.newUsersThisMonth}</span>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/users"
                        className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
                    >
                        Kelola Pengguna
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Event Moderation Overview */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Moderasi Event</h3>
                            <p className="text-sm text-gray-600">Setujui atau tolak event</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Menunggu Moderasi</span>
                            <span className="text-lg font-bold text-yellow-600">{stats.pendingEvents}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Event Disetujui</span>
                            <span className="text-lg font-bold text-green-600">{stats.activeEvents}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Event Ditolak</span>
                            <span className="text-lg font-bold text-red-600">{stats.rejectedEvents}</span>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/admin-events"
                        className="w-full mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-2 font-semibold"
                    >
                        Moderasi Event
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* System Administration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <Link
                    href="/dashboard/settings"
                    className="bg-white rounded-2xl shadow-md p-6 border-2 border-purple-100 group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">Pengaturan Sistem</h3>
                            <p className="text-sm text-gray-500">Konfigurasi platform dan pengaturan umum</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>

                <Link
                    href="/dashboard/analytics"
                    className="bg-white rounded-2xl shadow-md p-6 border-2 border-green-100 group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">Analitik Platform</h3>
                            <p className="text-sm text-gray-500">Laporan detail dan statistik lengkap</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Status Sistem</h3>
                            <p className="text-sm text-gray-600">Semua sistem berjalan dengan baik</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
