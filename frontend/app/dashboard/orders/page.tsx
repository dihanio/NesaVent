'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal, formatHarga } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface OrderItem {
  ticketType: string;
  harga: number;
  jumlah: number;
  subtotal: number;
}

interface Order {
  _id: string;
  event: {
    _id: string;
    nama: string;
    tanggalMulai: string;
    lokasi: string;
  };
  user: {
    nama: string;
    email: string;
  };
  items?: OrderItem[];
  jumlahTiket?: number;
  totalHarga: number;
  status: 'pending' | 'paid' | 'cancelled';
  namaPembeli: string;
  emailPembeli: string;
  nomorTelepon: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);

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
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, eventsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/events')
      ]);
      setOrders(ordersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchFilter = filter === 'all' || order.status === filter;
    const matchSearch = 
      order.namaPembeli.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.emailPembeli.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.event.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEvent = selectedEvent === 'all' || order.event._id === selectedEvent;
    
    return matchFilter && matchSearch && matchEvent;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.totalHarga, 0),
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat pesanan...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Pesanan Tiket</h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola semua pembelian tiket event Anda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Pesanan</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-yellow-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Pending</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Dibayar</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.paid}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-red-100">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Dibatalkan</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.cancelled}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-100 col-span-2 lg:col-span-1">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">{formatHarga(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6 border-2 border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Cari Pesanan</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama pembeli, email, atau event..."
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Event */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Filter Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
              >
                <option value="all">Semua Event</option>
                {events.map((event) => (
                  <option key={event._id} value={event._id}>{event.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Filter Status</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { label: 'Semua', value: 'all' as const },
                  { label: 'Pending', value: 'pending' as const },
                  { label: 'Dibayar', value: 'paid' as const },
                  { label: 'Dibatalkan', value: 'cancelled' as const },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                      filter === tab.value
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table/Cards */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
          {filteredOrders.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Pembeli</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Event</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Tiket</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-blue-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{order.namaPembeli}</p>
                            <p className="text-sm text-gray-500">{order.emailPembeli}</p>
                            <p className="text-sm text-gray-500">{order.nomorTelepon}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{order.event.nama}</p>
                            <p className="text-sm text-gray-500">{formatTanggal(order.event.tanggalMulai)}</p>
                            <p className="text-sm text-gray-500">{order.event.lokasi}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.items ? (
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium text-gray-900">{item.jumlah}x</span> {item.ticketType}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700">{order.jumlahTiket} tiket</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-green-600">{formatHarga(order.totalHarga)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'paid' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status === 'paid' ? 'Dibayar' : order.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                          </span>
                          {order.transactionId && (
                            <p className="text-xs text-gray-500 mt-1">ID: {order.transactionId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{formatTanggal(order.createdAt)}</p>
                            {order.paidAt && (
                              <p className="text-xs text-green-600">Dibayar: {formatTanggal(order.paidAt)}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="p-4 hover:bg-blue-50/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{order.namaPembeli}</h3>
                        <p className="text-sm text-gray-600 mb-1">{order.emailPembeli}</p>
                        <p className="text-sm text-gray-600">{order.nomorTelepon}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'paid' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status === 'paid' ? 'Dibayar' : order.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="font-semibold text-gray-900 mb-1">{order.event.nama}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatTanggal(order.event.tanggalMulai)}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {order.event.lokasi}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {order.items ? (
                        order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700"><span className="font-semibold">{item.jumlah}x</span> {item.ticketType}</span>
                            <span className="font-semibold text-gray-900">{formatHarga(item.subtotal)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{order.jumlahTiket} tiket</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-green-600 text-lg">{formatHarga(order.totalHarga)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500 pt-2">
                        <span>Tanggal: {formatTanggal(order.createdAt)}</span>
                        {order.paidAt && <span className="text-green-600">Dibayar: {formatTanggal(order.paidAt)}</span>}
                      </div>

                      {order.transactionId && (
                        <p className="text-xs text-gray-500 pt-1">Transaction ID: {order.transactionId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Pesanan</h3>
              <p className="text-gray-600 text-base max-w-md mx-auto">
                {searchQuery || selectedEvent !== 'all' || filter !== 'all'
                  ? 'Tidak ada pesanan yang sesuai dengan filter.'
                  : 'Belum ada pembelian tiket untuk event Anda.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
