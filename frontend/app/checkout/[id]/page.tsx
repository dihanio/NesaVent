'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

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
  items: Array<{
    tipeTiket: string;
    namaTipe: string;
    hargaSatuan: number;
    jumlah: number;
    subtotal: number;
  }>;
  totalHarga: number;
  status: string;
  namaPembeli?: string;
  emailPembeli?: string;
  nomorTelepon?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    namaPembeli: '',
    emailPembeli: '',
    nomorTelepon: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}`);
      setOrder(response.data);

      // Pre-fill form with user data if available
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setFormData({
          namaPembeli: currentUser.nama || '',
          emailPembeli: currentUser.email || '',
          nomorTelepon: currentUser.nomorTelepon || '',
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Order tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const formatHarga = (harga: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(harga);
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.namaPembeli.trim()) {
      setError('Nama pembeli wajib diisi');
      return;
    }
    if (!formData.emailPembeli.trim()) {
      setError('Email pembeli wajib diisi');
      return;
    }
    if (!formData.nomorTelepon.trim()) {
      setError('Nomor telepon wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      // Update order with buyer details
      await api.put(`/orders/${params.id}`, {
        namaPembeli: formData.namaPembeli,
        emailPembeli: formData.emailPembeli,
        nomorTelepon: formData.nomorTelepon,
      });

      // Create payment transaction with Midtrans
      const { data } = await api.post('/payment/create', {
        orderId: params.id
      });

      // Open Midtrans Snap payment modal
      (window as any).snap.pay(data.token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          router.push('/dashboard/my-orders?payment=success');
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          router.push('/dashboard/my-orders?payment=pending');
        },
        onError: function(result: any) {
          console.error('Payment error:', result);
          setError('Pembayaran gagal. Silakan coba lagi.');
          setSubmitting(false);
        },
        onClose: function() {
          console.log('Payment modal closed');
          setSubmitting(false);
        }
      });
    } catch (err: unknown) {
      console.error('Error during checkout:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat checkout...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Order tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-gray-100 py-8 pt-24">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ringkasan Pesanan</h2>

            {/* Event Info */}
            <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-6">
              <div className="flex gap-4">
                <img
                  src={order.event.gambar}
                  alt={order.event.nama}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/images/default-event.jpg';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{order.event.nama}</h3>
                  <p className="text-gray-600 text-sm">{formatTanggal(order.event.tanggal)}</p>
                  <p className="text-gray-600 text-sm">{order.event.waktu} • {order.event.lokasi}</p>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-900">Detail Tiket</h4>
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{item.namaTipe}</p>
                    <p className="text-sm text-gray-600">{item.jumlah} tiket × {formatHarga(item.hargaSatuan)}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatHarga(item.subtotal)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Pembayaran</span>
                <span className="text-blue-600">{formatHarga(order.totalHarga)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informasi Pembeli</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.namaPembeli}
                  onChange={(e) => setFormData({ ...formData, namaPembeli: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.emailPembeli}
                  onChange={(e) => setFormData({ ...formData, emailPembeli: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan alamat email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  value={formData.nomorTelepon}
                  onChange={(e) => setFormData({ ...formData, nomorTelepon: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nomor telepon"
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💳 Metode Pembayaran</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Setelah mengisi data pembeli, Anda akan diarahkan ke halaman pembayaran Midtrans untuk menyelesaikan transaksi.
                </p>
                <p className="text-xs text-blue-600">
                  Pembayaran tersedia melalui: Transfer Bank, E-Wallet (GoPay, OVO, DANA), Kartu Kredit/Debit, dan Indomaret/Alfamart.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform hover:-translate-y-1 ${
                  !submitting
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Memproses Pembayaran...' : 'Bayar Sekarang'}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              Dengan menyelesaikan pembayaran, Anda menyetujui syarat & ketentuan yang berlaku.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}