'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal, formatHarga } from '@/lib/formatters';

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
    return filter === 'all' || order.status === filter;
  });

  const handlePayOrder = (orderId: string) => {
    router.push(`/checkout/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      return;
    }

    try {
      await api.put(`/orders/${orderId}/cancel`);
      // Refresh orders
      fetchOrders();
      alert('Pesanan berhasil dibatalkan');
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Gagal membatalkan pesanan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pesanan Saya
          </h1>
          <p className="text-gray-600">
            Kelola semua pesanan tiket Anda
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
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
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                filter === tab.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800">
                  <img
                    src={order.event.gambar}
                    alt={order.event.nama}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/default-event.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
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
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{order.event.nama}</h3>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>📅 {formatTanggal(order.event.tanggal)}</p>
                    <p>🕐 {order.event.waktu}</p>
                    <p>📍 {order.event.lokasi}</p>
                  </div>

                  {/* Ticket Details */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    {order.items ? (
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.jumlah}x {item.namaTipe}</span>
                            <span className="font-semibold text-gray-900">{formatHarga(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{order.jumlahTiket} tiket</p>
                    )}
                    
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-green-600 text-lg">{formatHarga(order.totalHarga)}</span>
                    </div>
                  </div>

                  {/* Buyer Details */}
                  {order.buyerDetails && order.buyerDetails.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Detail Pembeli</h4>
                      <div className="space-y-2">
                        {order.buyerDetails.map((detail: any, idx: number) => (
                          <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                            <p className="font-medium text-gray-900">Tiket #{idx + 1}</p>
                            <p className="text-gray-700">{detail.nama}</p>
                            <p className="text-gray-700">{detail.email}</p>
                            <p className="text-gray-700">{detail.nomorTelepon}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handlePayOrder(order._id)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          Bayar Sekarang
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
                        >
                          Batalkan
                        </button>
                      </>
                    )}
                    
                    {order.status === 'paid' && (
                      <button
                        onClick={() => router.push('/my-tickets')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Lihat Tiket
                      </button>
                    )}

                    {order.status === 'expired' && (
                      <button
                        onClick={() => router.push(`/events/${order.event._id}`)}
                        className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition font-medium"
                      >
                        Pesan Lagi
                      </button>
                    )}

                    <button
                      onClick={() => router.push(`/events/${order.event._id}`)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Detail Event
                    </button>
                  </div>

                  {/* Order Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <p>Pesanan dibuat: {formatTanggal(order.createdAt)}</p>
                    {order.status === 'pending' && order.expiresAt && (
                      <p className="text-orange-600 font-medium">Kadaluarsa: {formatTanggal(order.expiresAt)}</p>
                    )}
                    {order.paidAt && <p>Dibayar: {formatTanggal(order.paidAt)}</p>}
                    {order.transactionId && <p>ID Transaksi: {order.transactionId}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Pesanan</h3>
            <p className="text-gray-600 text-base max-w-md mx-auto mb-6">
              {filter === 'all'
                ? 'Anda belum memiliki pesanan tiket.'
                : `Tidak ada pesanan dengan status ${filter}.`}
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
  );
}