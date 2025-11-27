'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal, formatHarga } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface TicketType {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  stokTersisa: number;
  deskripsi: string;
}

interface Ticket {
  _id: string;
  nama: string;
  harga: number;
  event: {
    _id: string;
    nama: string;
    tanggal: string;
    lokasi: string;
    gambar?: string;
  };
  order: {
    _id: string;
    createdAt: string;
    status: string;
  };
  qrCode?: string;
  isUsed: boolean;
}

interface Order {
  _id: string;
  totalHarga: number;
  status: string;
  createdAt: string;
  items: {
    ticket: Ticket;
    quantity: number;
  }[];
}

interface Event {
  _id: string;
  nama: string;
  slug: string;
  tanggal: string;
  lokasi: string;
  kategori: string;
  harga?: number;
  stok?: number;
  tiketTersedia?: TicketType[];
  totalStok?: number;
  totalStokTersisa?: number;
  status: 'draft' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan' | 'ditolak';
  gambar?: string;
  createdAt: string;
  alasanDitolak?: string;
  isVerified?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan' | 'ditolak'>('all');
  const [sortBy, setSortBy] = useState<'tanggal' | 'nama' | 'terbaru'>('terbaru');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingEvents: 0,
    activeMitra: 0,
    newUsersThisMonth: 0,
    rejectedEvents: 0,
  });
  const [user, setUser] = useState<any>(null);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchDashboardData(currentUser?.role);
  }, []);

  const fetchDashboardData = async (role?: string) => {
    if (role === 'admin') {
      // Admin dashboard - show global stats
      try {
        const response = await api.get('/admin/dashboard');
        // For admin, we show platform-wide statistics
        setStats({
          totalUsers: response.data.totalUsers || 0,
          totalEvents: response.data.totalEvents || 0,
          activeEvents: response.data.activeEvents || 0,
          totalTicketsSold: response.data.totalTicketsSold || 0,
          totalRevenue: response.data.totalRevenue || 0,
          totalOrders: response.data.totalOrders || 0,
          pendingOrders: response.data.pendingOrders || 0,
          pendingEvents: response.data.pendingEvents || 0,
          activeMitra: response.data.activeMitra || 0,
          newUsersThisMonth: response.data.newUsersThisMonth || 0,
          rejectedEvents: response.data.rejectedEvents || 0,
        });
      } catch (error) {
        console.error('Error fetching admin dashboard:', error);
      }
    } else if (role === 'mitra') {
      // Mitra dashboard - show partner's events and stats
      try {
        const response = await api.get('/admin/dashboard');
        setStats({
          totalEvents: response.data.totalEvents || 0,
          activeEvents: response.data.activeEvents || 0,
          totalTicketsSold: response.data.totalTicketsSold || 0,
          totalRevenue: response.data.totalRevenue || 0,
          totalUsers: 0,
          totalOrders: response.data.totalOrders || 0,
          pendingOrders: 0,
          pendingEvents: response.data.pendingEvents || 0,
          activeMitra: 0,
          newUsersThisMonth: 0,
          rejectedEvents: 0,
        });
      } catch (error) {
        console.error('Error fetching mitra dashboard:', error);
      }
      fetchEvents();
    } else if (role === 'user') {
      // User dashboard - show user's tickets and orders
      await fetchUserDashboardData();
    }
    setLoading(false);
  };

  const fetchUserDashboardData = async () => {
    try {
      // Fetch user's tickets
      const ticketsResponse = await api.get('/tickets/my-tickets');
      setUserTickets(ticketsResponse.data);

      // Fetch user's orders
      const ordersResponse = await api.get('/orders/my-orders');
      setUserOrders(ordersResponse.data);

      // Fetch upcoming events
      const eventsResponse = await api.get('/events?status=aktif&limit=5');
      setUpcomingEvents(eventsResponse.data);

      // Calculate user stats
      const totalTickets = ticketsResponse.data.length;
      const usedTickets = ticketsResponse.data.filter((ticket: Ticket) => ticket.isUsed).length;
      const totalSpent = ordersResponse.data.reduce((sum: number, order: Order) => sum + order.totalHarga, 0);
      const upcomingTickets = ticketsResponse.data.filter((ticket: Ticket) =>
        new Date(ticket.event.tanggal) > new Date()
      ).length;

      setStats({
        totalEvents: upcomingTickets,
        activeEvents: totalTickets - usedTickets,
        totalTicketsSold: totalTickets,
        totalRevenue: totalSpent,
        totalUsers: 0,
        totalOrders: ordersResponse.data.length,
        pendingOrders: 0,
        pendingEvents: 0,
        activeMitra: 0,
        newUsersThisMonth: 0,
        rejectedEvents: 0,
      });
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events/my-events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleDeleteEvent = async (slug: string) => {
    if (!confirm('Yakin ingin menghapus event ini?')) return;

    try {
      await api.delete(`/events/${slug}`);
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus event');
    }
  };

  const handleSort = (column: 'nama' | 'tanggal') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleSubmitEvent = async (slug: string) => {
    if (!confirm('Ajukan event ini untuk verifikasi admin?')) return;

    try {
      const response = await api.put(`/admin/events/${slug}/submit`);
      alert(response.data.message);
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengajukan event');
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin Dashboard
  if (user?.role === 'admin') {
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
                href="/admin/users"
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
                href="/admin/events"
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
              href="/admin/settings"
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
              href="/admin/analytics"
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
      </DashboardLayout>
    );
  }

  // Mitra Dashboard (existing content)
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
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${
                      filterStatus === filter.value
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
                        {event.tiketTersedia && event.tiketTersedia.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-semibold text-blue-600">
                              {formatHarga(Math.min(...event.tiketTersedia.map(t => t.harga)))}
                            </div>
                            {event.tiketTersedia.length > 1 && (
                              <div className="text-xs text-gray-500">
                                - {formatHarga(Math.max(...event.tiketTersedia.map(t => t.harga)))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-blue-600">{formatHarga(event.harga || 0)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.tiketTersedia && event.tiketTersedia.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              {event.totalStok || event.tiketTersedia.reduce((sum, t) => sum + t.stok, 0)}
                            </div>
                            {event.tiketTersedia.length > 1 && (
                              <div className="text-xs text-gray-500">
                                {event.tiketTersedia.length} tipe
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-gray-900">{event.stok || 0}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-lg ${
                            event.status === 'aktif' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : event.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : event.status === 'draft'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : event.status === 'ditolak'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : event.status === 'selesai'
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                          {event.status === 'ditolak' && event.alasanDitolak && (
                            <div className="text-xs text-red-600 mt-1">
                              {event.alasanDitolak}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 flex-wrap">
                          {event.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitEvent(event.slug)}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold text-xs flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Ajukan
                            </button>
                          )}
                          {(event.status === 'aktif' || event.status === 'pending') && (
                            <Link
                              href={`/dashboard/events/analytics/${event.slug}`}
                              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-semibold text-xs"
                            >
                              Analitik
                            </Link>
                          )}
                          {(event.status === 'draft' || event.status === 'ditolak') && (
                            <Link
                              href={`/dashboard/events/edit/${event.slug}`}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold text-xs"
                            >
                              Edit
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(event.slug)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-xs"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filteredAndSortedEvents.map((event) => (
                <div key={event._id} className="p-4 hover:bg-blue-50/50 transition-colors">
                  <div className="flex gap-3 mb-3">
                    {event.gambar ? (
                      <img 
                        src={event.gambar} 
                        alt={event.nama}
                        className="w-20 h-20 rounded-xl object-cover shadow-md border-2 border-blue-100 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-linear-to-br from-blue-100 to-yellow-100 rounded-xl flex items-center justify-center shrink-0 border-2 border-blue-100 shadow-md">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm">{event.nama}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatTanggal(event.tanggal)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.lokasi}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                          event.status === 'aktif' ? 'bg-green-100 text-green-700' :
                          event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          event.status === 'ditolak' ? 'bg-red-100 text-red-700' :
                          event.status === 'selesai' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          {event.tiketTersedia && event.tiketTersedia.length > 0
                            ? `${formatHarga(Math.min(...event.tiketTersedia.map(t => t.harga)))} - ${formatHarga(Math.max(...event.tiketTersedia.map(t => t.harga)))}`
                            : formatHarga(event.harga || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {event.status === 'ditolak' && event.alasanDitolak && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                      <p className="text-xs text-red-700">
                        <span className="font-semibold">Alasan ditolak:</span> {event.alasanDitolak}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitEvent(event.slug)}
                        className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold text-xs"
                      >
                        Submit
                      </button>
                    )}
                    {(event.status === 'aktif' || event.status === 'pending') && (
                      <Link
                        href={`/dashboard/events/analytics/${event.slug}`}
                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-semibold text-xs"
                      >
                        Analitik
                      </Link>
                    )}
                    {(event.status === 'draft' || event.status === 'ditolak') && (
                      <Link
                        href={`/dashboard/events/edit/${event.slug}`}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold text-xs"
                      >
                        Edit
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event.slug)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {filterStatus === 'all' ? 'Belum Ada Event' : `Tidak Ada Event ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}`}
              </h3>
              <p className="text-gray-600 text-base mb-8 max-w-md mx-auto">
                {filterStatus === 'all' 
                  ? 'Mulai membuat event pertama Anda untuk menjangkau lebih banyak peserta dan mengembangkan bisnis Anda.'
                  : 'Coba pilih filter lain atau buat event baru.'}
              </p>
              <Link
                href="/dashboard/events/create"
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Event Pertama
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );

  // User Dashboard
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Dashboard Pengguna</h1>
              </div>
              <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola tiket dan pesanan Anda</p>
            </div>
            <Link
              href="/events"
              className="w-full md:w-auto bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold text-sm md:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cari Event
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Tiket</p>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.totalTicketsSold}</p>
            <p className="text-xs md:text-sm text-gray-400 mt-2">Tiket yang dimiliki</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Tiket Aktif</p>
            <p className="text-4xl font-bold text-green-600">{stats.activeEvents}</p>
            <p className="text-sm text-gray-400 mt-2">Belum digunakan</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Event Mendatang</p>
            <p className="text-4xl font-bold text-yellow-600">{stats.totalEvents}</p>
            <p className="text-sm text-gray-400 mt-2">Dengan tiket aktif</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-blue-600">{formatHarga(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-400 mt-2">Untuk pembelian tiket</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Link
            href="/my-tickets"
            className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-100 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Tiket Saya</h3>
                <p className="text-sm text-gray-500">Lihat semua tiket yang Anda miliki</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/my-orders"
            className="bg-white rounded-2xl shadow-md p-6 border-2 border-yellow-100 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">Riwayat Pesanan</h3>
                <p className="text-sm text-gray-500">Lihat semua pesanan Anda</p>
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
                <h3 className="text-lg font-bold text-gray-900 mb-1">Tips & Info</h3>
                <p className="text-sm text-gray-600">Jangan lupa untuk menukarkan tiket di lokasi event!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Recent Tickets */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tiket Terbaru</h3>
                <p className="text-sm text-gray-600">Tiket yang baru dibeli</p>
              </div>
            </div>
            <div className="space-y-4">
              {userTickets.slice(0, 3).map((ticket) => (
                <div key={ticket._id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  {ticket.event.gambar ? (
                    <img
                      src={ticket.event.gambar}
                      alt={ticket.event.nama}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{ticket.event.nama}</h4>
                    <p className="text-xs text-gray-600">{formatTanggal(ticket.event.tanggal)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        ticket.isUsed ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {ticket.isUsed ? 'Sudah Digunakan' : 'Aktif'}
                      </span>
                      <span className="text-xs font-semibold text-blue-600">{formatHarga(ticket.harga)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {userTickets.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Belum ada tiket</p>
                  <Link
                    href="/events"
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-2 inline-block"
                  >
                    Cari event sekarang →
                  </Link>
                </div>
              )}
            </div>
            {userTickets.length > 3 && (
              <Link
                href="/my-tickets"
                className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
              >
                Lihat Semua Tiket
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Event Mendatang</h3>
                <p className="text-sm text-gray-600">Event yang mungkin Anda minati</p>
              </div>
            </div>
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event._id} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                  {event.gambar ? (
                    <img
                      src={event.gambar}
                      alt={event.nama}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{event.nama}</h4>
                    <p className="text-xs text-gray-600">{formatTanggal(event.tanggal)}</p>
                    <p className="text-xs text-gray-500 mt-1">{event.lokasi}</p>
                  </div>
                  <Link
                    href={`/events/${event.slug}`}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition"
                  >
                    Lihat
                  </Link>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Tidak ada event mendatang</p>
                </div>
              )}
            </div>
            {upcomingEvents.length > 3 && (
              <Link
                href="/events"
                className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-semibold"
              >
                Lihat Semua Event
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
