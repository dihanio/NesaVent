'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal, formatHarga } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface OrderItem {
  ticketTypeId: string;
  namaTipe: string;
  hargaSatuan: number;
  jumlah: number;
  subtotal: number;
}

interface Order {
  _id: string;
  event: {
    _id: string;
    nama: string;
    tanggal: string;
    waktu: string;
    lokasi: string;
    gambar: string;
    slug: string;
  };
  items?: OrderItem[];
  jumlahTiket?: number;
  totalHarga: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  namaPembeli: string;
  emailPembeli: string;
  nomorTelepon: string;
  buyerDetails?: any[];
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'expired' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = searchQuery === '' ||
      order.event.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.namaPembeli.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.emailPembeli.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    expired: orders.filter(o => o.status === 'expired').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.totalHarga, 0)
  };

  const handlePayOrder = (orderId: string) => {
    router.push(`/checkout/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      return;
    }

    try {
      await api.put(`/orders/${orderId}/cancel`);
      fetchOrders();
      alert('Pesanan berhasil dibatalkan');
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Gagal membatalkan pesanan');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Pesanan Saya</h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola semua pesanan tiket event Anda</p>
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
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Kadaluarsa</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.expired}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-100 col-span-2 lg:col-span-1">
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Dibatalkan</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6 border-2 border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Cari Pesanan</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama event, pembeli, atau email..."
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Filter Status</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { label: 'Semua', value: 'all' as const },
                  { label: 'Pending', value: 'pending' as const },
                  { label: 'Dibayar', value: 'paid' as const },
                  { label: 'Kadaluarsa', value: 'expired' as const },
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Event</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Tiket</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-blue-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={order.event.gambar}
                              alt={order.event.nama}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/images/default-event.jpg';
                              }}
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{order.event.nama}</p>
                              <p className="text-sm text-gray-500">{formatTanggal(order.event.tanggal)}</p>
                              <p className="text-sm text-gray-500">{order.event.lokasi}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.items ? (
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{item.jumlah}x {item.namaTipe}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700">{order.jumlahTiket} tiket</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-green-600">{formatHarga(order.totalHarga)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'paid' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status === 'paid' ? 'Dibayar' :
                             order.status === 'pending' ? 'Pending' :
                             order.status === 'expired' ? 'Kadaluarsa' :
                             'Dibatalkan'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{formatTanggal(order.createdAt)}</p>
                          {order.status === 'pending' && order.expiresAt && (
                            <p className="text-xs text-orange-600">Kadaluarsa: {formatTanggal(order.expiresAt)}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handlePayOrder(order._id)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                >
                                  Bayar
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="px-3 py-1 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition"
                                >
                                  Batal
                                </button>
                              </>
                            )}

                            {order.status === 'paid' && (
                              <button
                                onClick={() => router.push('/dashboard/my-tickets')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                              >
                                Lihat Tiket
                              </button>
                            )}

                            {order.status === 'expired' && (
                              <button
                                onClick={() => router.push(`/events/${order.event.slug}`)}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition"
                              >
                                Pesan Lagi
                              </button>
                            )}

                            <button
                              onClick={() => router.push(`/events/${order.event.slug}`)}
                              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
                            >
                              Detail Event
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                <div className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <div key={order._id} className="p-4 hover:bg-blue-50/50">
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={order.event.gambar}
                          alt={order.event.nama}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-event.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{order.event.nama}</h3>
                          <p className="text-xs text-gray-500 mb-1">{formatTanggal(order.event.tanggal)} • {order.event.lokasi}</p>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'paid' ? 'bg-green-100 text-green-700' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'expired' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status === 'paid' ? 'Dibayar' :
                               order.status === 'pending' ? 'Pending' :
                               order.status === 'expired' ? 'Kadaluarsa' :
                               'Dibatalkan'}
                            </span>
                            <span className="text-xs text-gray-500">{formatTanggal(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {order.items ? (
                            <div className="text-xs text-gray-600">
                              {order.items.map((item, idx) => (
                                <div key={idx}>{item.jumlah}x {item.namaTipe}</div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">{order.jumlahTiket} tiket</p>
                          )}
                        </div>
                        <p className="font-bold text-green-600 text-sm">{formatHarga(order.totalHarga)}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePayOrder(order._id)}
                              className="flex-1 min-w-0 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                            >
                              Bayar
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="px-3 py-2 border border-red-300 text-red-600 text-xs rounded-lg hover:bg-red-50 transition"
                            >
                              Batal
                            </button>
                          </>
                        )}

                        {order.status === 'paid' && (
                          <button
                            onClick={() => router.push('/dashboard/my-tickets')}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                          >
                            Lihat Tiket
                          </button>
                        )}

                        {order.status === 'expired' && (
                          <button
                            onClick={() => router.push(`/events/${order.event.slug}`)}
                            className="flex-1 px-3 py-2 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition"
                          >
                            Pesan Lagi
                          </button>
                        )}

                        <button
                          onClick={() => router.push(`/events/${order.event.slug}`)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition"
                        >
                          Detail Event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Pesanan</h3>
              <p className="text-gray-600 text-base max-w-md mx-auto mb-6">
                {filter === 'all' && searchQuery === ''
                  ? 'Anda belum memiliki pesanan tiket.'
                  : 'Tidak ada pesanan yang sesuai dengan filter.'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Jelajahi Event
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}