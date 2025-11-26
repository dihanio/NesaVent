'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatHarga, formatTanggal } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface Event {
  _id: string;
  nama: string;
  tanggal: string;
  status: string;
  tiketTersedia: Array<{
    nama: string;
    harga: number;
    stok: number;
    stokTersisa: number;
  }>;
}

interface Order {
  _id: string;
  event: {
    _id: string;
    nama: string;
  };
  totalHarga: number;
  status: string;
  createdAt: string;
  items?: Array<{
    namaTipe: string;
    jumlah: number;
    hargaSatuan: number;
  }>;
}

interface AnalyticsSummary {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalOrders: number;
  totalTicketsSold: number;
  averageOrderValue: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalTicketsSold: 0,
    averageOrderValue: 0
  });
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

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
  }, [timeFilter]);

  const fetchData = async () => {
    try {
      const [eventsRes, ordersRes] = await Promise.all([
        api.get('/events'),
        api.get('/orders')
      ]);

      const myEvents = eventsRes.data;
      const myEventIds = myEvents.map((e: Event) => e._id);
      
      // Filter orders untuk event milik user
      const myOrders = ordersRes.data.filter((order: Order) => 
        myEventIds.includes(order.event._id)
      );

      // Filter berdasarkan waktu
      const filteredOrders = filterOrdersByTime(myOrders, timeFilter);

      setEvents(myEvents);
      setOrders(filteredOrders);
      calculateSummary(myEvents, filteredOrders);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByTime = (orders: Order[], filter: string) => {
    if (filter === 'all') return orders;

    const now = new Date();
    const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  };

  const calculateSummary = (events: Event[], orders: Order[]) => {
    const paidOrders = orders.filter(o => o.status === 'paid');
    
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalHarga, 0);
    const totalTicketsSold = paidOrders.reduce((sum, order) => {
      if (order.items && order.items.length > 0) {
        return sum + order.items.reduce((itemSum, item) => itemSum + item.jumlah, 0);
      }
      return sum;
    }, 0);

    setSummary({
      totalEvents: events.length,
      activeEvents: events.filter(e => e.status === 'aktif').length,
      totalRevenue,
      totalOrders: paidOrders.length,
      totalTicketsSold,
      averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0
    });
  };

  const getEventStats = () => {
    return events.map(event => {
      const eventOrders = orders.filter(o => o.event._id === event._id && o.status === 'paid');
      const revenue = eventOrders.reduce((sum, o) => sum + o.totalHarga, 0);
      const ticketsSold = eventOrders.reduce((sum, order) => {
        if (order.items && order.items.length > 0) {
          return sum + order.items.reduce((itemSum, item) => itemSum + item.jumlah, 0);
        }
        return sum;
      }, 0);

      const totalStok = event.tiketTersedia?.reduce((sum, t) => sum + t.stok, 0) || 0;
      const soldPercentage = totalStok > 0 ? (ticketsSold / totalStok) * 100 : 0;

      return {
        eventId: event._id,
        eventNama: event.nama,
        revenue,
        orders: eventOrders.length,
        ticketsSold,
        totalStok,
        soldPercentage: Math.round(soldPercentage),
        status: event.status
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  const getRecentOrders = () => {
    return orders
      .filter(o => o.status === 'paid')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat data analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const eventStats = getEventStats();
  const recentOrders = getRecentOrders();

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-8 mb-8 border-2 border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-blue-600">Analytics</h1>
              </div>
              <p className="text-gray-600 text-lg ml-15">Monitor performa event dan penjualan tiket Anda</p>
            </div>

            {/* Time Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { label: '7 Hari', value: '7d' as const },
                { label: '30 Hari', value: '30d' as const },
                { label: '90 Hari', value: '90d' as const },
                { label: 'Semua', value: 'all' as const }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setTimeFilter(filter.value)}
                  className={`px-3 md:px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                    timeFilter === filter.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-100">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Pendapatan</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{formatHarga(summary.totalRevenue)}</p>
            <p className="text-xs md:text-sm text-gray-400 mt-2">{summary.totalOrders} transaksi sukses</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Tiket Terjual</p>
            <p className="text-3xl font-bold text-yellow-600">{summary.totalTicketsSold}</p>
            <p className="text-sm text-gray-400 mt-2">Dari {summary.totalEvents} event</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Rata-rata Transaksi</p>
            <p className="text-3xl font-bold text-blue-600">{formatHarga(summary.averageOrderValue)}</p>
            <p className="text-sm text-gray-400 mt-2">Per pesanan</p>
          </div>
        </div>

        {/* Event Performance */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Performa Event
          </h2>

          {eventStats.length > 0 ? (
            <div className="space-y-4">
              {eventStats.map((stat, index) => (
                <div key={stat.eventId} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                        <h3 className="text-lg font-bold text-gray-900">{stat.eventNama}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          stat.status === 'aktif' ? 'bg-green-100 text-green-700' : 
                          stat.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {stat.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Pendapatan</p>
                          <p className="text-lg font-bold text-green-600">{formatHarga(stat.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Pesanan</p>
                          <p className="text-lg font-bold text-gray-900">{stat.orders}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tiket Terjual</p>
                          <p className="text-lg font-bold text-yellow-600">{stat.ticketsSold} / {stat.totalStok}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Persentase Terjual</p>
                          <p className="text-lg font-bold text-blue-600">{stat.soldPercentage}%</p>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-linear-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(stat.soldPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">Data performa event akan muncul di sini</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Transaksi Terbaru
          </h2>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Tiket</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatTanggal(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{order.event.nama}</div>
                      </td>
                      <td className="px-6 py-4">
                        {order.items && order.items.length > 0 ? (
                          <div className="text-sm text-gray-600">
                            {order.items.map((item, i) => (
                              <div key={i}>
                                {item.jumlah}x {item.namaTipe}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">{formatHarga(order.totalHarga)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Transaksi</h3>
              <p className="text-gray-600">Transaksi terbaru akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
