'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal, formatTanggalWaktu, formatHarga } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface Event {
  _id: string;
  nama: string;
  tanggal: string;
  lokasi: string;
  kategori: string;
  harga: number;
  stok: number;
  status: string;
}

interface Order {
  _id: string;
  user: {
    nama: string;
    email: string;
  };
  event: {
    _id: string;
    nama: string;
  };
  jumlahTiket: number;
  totalHarga: number;
  namaPembeli: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    ticketsSold: 0,
    ticketsRemaining: 0,
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!authService.isMitra()) {
      router.push('/');
      return;
    }
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // Fetch event details
      const eventResponse = await api.get(`/events/${params.id}`);
      setEvent(eventResponse.data);

      // Fetch orders untuk event ini
      const ordersResponse = await api.get('/orders/my-orders');
      const eventOrders = ordersResponse.data.filter(
        (order: Order) => order.event._id === params.id
      );
      setOrders(eventOrders);
      calculateStats(eventResponse.data, eventOrders);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (eventData: Event, ordersData: Order[]) => {
    const paidOrders = ordersData.filter(o => o.status === 'paid');
    const pendingOrders = ordersData.filter(o => o.status === 'pending');
    
    const ticketsSold = paidOrders.reduce((sum, order) => sum + order.jumlahTiket, 0);
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalHarga, 0);

    setStats({
      totalOrders: ordersData.length,
      pendingOrders: pendingOrders.length,
      paidOrders: paidOrders.length,
      totalRevenue,
      ticketsSold,
      ticketsRemaining: eventData.stok,
    });
  };



  const getStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      paid: 'Dibayar',
      pending: 'Menunggu',
      cancelled: 'Dibatalkan',
      expired: 'Kadaluarsa',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Nama Pembeli', 'Email', 'Jumlah Tiket', 'Total Harga', 'Status'];
    const rows = orders.map(order => [
      formatTanggalWaktu(order.createdAt),
      order.namaPembeli,
      order.user.email,
      order.jumlahTiket,
      order.totalHarga,
      getStatusText(order.status),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-penjualan-${event?.nama}-${new Date().getTime()}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat analitik...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-xl text-gray-600">Event tidak ditemukan</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">{event.nama}</h1>
              <p className="text-gray-600 text-lg">Analitik & Laporan Penjualan</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">📅 {formatTanggal(event.tanggal)}</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-medium">📍 {event.lokasi}</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium">
                  {event.kategori}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition shadow-md"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Total Pesanan</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-green-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Pesanan Dibayar</p>
            <p className="text-3xl font-bold text-green-600">{stats.paidOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-yellow-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Menunggu Bayar</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Tiket Terjual</p>
            <p className="text-3xl font-bold text-blue-600">{stats.ticketsSold}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Tiket Tersisa</p>
            <p className="text-3xl font-bold text-blue-600">{stats.ticketsRemaining}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-yellow-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Total Pendapatan</p>
            <p className="text-2xl font-bold text-yellow-600">{formatHarga(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Ringkasan Penjualan</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Harga per Tiket</span>
                  <span className="font-semibold">{formatHarga(event.harga)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Tiket</span>
                  <span className="font-semibold">{stats.ticketsSold + stats.ticketsRemaining}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tiket Terjual</span>
                  <span className="font-semibold text-green-600">{stats.ticketsSold}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Persentase Terjual</span>
                  <span className="font-semibold text-blue-600">
                    {((stats.ticketsSold / (stats.ticketsSold + stats.ticketsRemaining)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{
                      width: `${(stats.ticketsSold / (stats.ticketsSold + stats.ticketsRemaining)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Potensi Pendapatan Maksimal</span>
                  <span className="font-bold text-lg">
                    {formatHarga(event.harga * (stats.ticketsSold + stats.ticketsRemaining))}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600 font-medium">Pendapatan Saat Ini</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatHarga(stats.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-yellow-100">
            <h2 className="text-xl font-bold text-yellow-600 mb-4">Distribusi Status Pesanan</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-700">Dibayar</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">{stats.paidOrders}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({stats.totalOrders > 0 ? ((stats.paidOrders / stats.totalOrders) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-gray-700">Menunggu Pembayaran</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">{stats.pendingOrders}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({stats.totalOrders > 0 ? ((stats.pendingOrders / stats.totalOrders) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-700">Dibatalkan/Kadaluarsa</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">
                    {stats.totalOrders - stats.paidOrders - stats.pendingOrders}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({stats.totalOrders > 0 ? (((stats.totalOrders - stats.paidOrders - stats.pendingOrders) / stats.totalOrders) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Total Semua Pesanan</span>
                  <span className="font-bold text-xl">{stats.totalOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-blue-100">
          <div className="px-6 py-4 border-b-2 border-blue-100 bg-blue-50">
            <h2 className="text-xl font-bold text-blue-600">Riwayat Transaksi</h2>
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pembeli
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Tiket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTanggal(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.namaPembeli}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.jumlahTiket}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatHarga(order.totalHarga)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
