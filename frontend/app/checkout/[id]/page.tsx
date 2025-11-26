'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import PromoCodeInput from '@/components/PromoCodeInput';

declare global {
  interface Window {
    snap: any;
  }
}

interface BuyerDetail {
  ticketTypeId: string;
  nama: string;
  email: string;
  nomorTelepon: string;
  useAccountDetails?: boolean;
}

interface Order {
  _id: string;
  jumlahTiket: number;
  totalHarga: number;
  discountAmount?: number;
  finalTotal?: number;
  namaPembeli: string;
  emailPembeli: string;
  nomorTelepon: string;
  buyerDetails?: BuyerDetail[];
  status: string;
  user?: {
    nama: string;
    email: string;
    nomorTelepon?: string;
  };
  event: {
    _id: string;
    nama: string;
    tanggal: string;
    waktu: string;
    lokasi: string;
    gambar: string;
  };
  items?: {
    ticketTypeId: string;
    namaTipe: string;
    hargaSatuan: number;
    jumlah: number;
    subtotal: number;
  }[];
  promoCode?: {
    _id: string;
    code: string;
    discountType: string;
    discountValue: number;
    description?: string;
  };
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState<BuyerDetail[]>([]);
  const [submittingDetails, setSubmittingDetails] = useState(false);
  const [hasUsedAccountDetails, setHasUsedAccountDetails] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [currentTotal, setCurrentTotal] = useState(0);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if user is mitra or admin - they cannot buy tickets
    if (authService.isMitraOrAdmin()) {
      const currentUser = authService.getCurrentUser();
      const roleText = currentUser?.role === 'mitra' ? 'mitra' : 'admin';
      alert(`Akun ${roleText} tidak dapat membeli tiket. Silakan gunakan akun regular untuk pembelian tiket.`);
      router.push('/');
      return;
    }

    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}`);
      setOrder(response.data);
      setCurrentTotal(response.data.finalTotal || response.data.totalHarga);
      setAppliedPromoCode(response.data.promoCode || null);
      
      // Check if user has used account details before
      await checkHasUsedAccountDetails();
      
      // Initialize buyer details if not present or empty
      if (response.data.items && (!response.data.buyerDetails || response.data.buyerDetails.length === 0)) {
        const details: BuyerDetail[] = [];
        response.data.items.forEach((item: any) => {
          for (let i = 0; i < item.jumlah; i++) {
            details.push({
              ticketTypeId: item.ticketTypeId,
              nama: '',
              email: '',
              nomorTelepon: '',
              useAccountDetails: false, // Don't auto-enable, let user choose
            });
          }
        });
        setBuyerDetails(details);
      } else if (response.data.buyerDetails && response.data.buyerDetails.length > 0) {
        setBuyerDetails(response.data.buyerDetails);
      } else {
        setBuyerDetails([]);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkHasUsedAccountDetails = async () => {
    try {
      // Check if user has any paid orders with buyer details that match their account data
      const response = await api.get('/orders/my-orders');
      const orders = response.data;
      const currentUser = authService.getCurrentUser();
      
      const hasUsed = orders.some((order: any) => {
        if (order.status === 'paid' && order.buyerDetails && order.buyerDetails.length > 0 && currentUser) {
          return order.buyerDetails.some((detail: any) => {
            return detail.nama === currentUser.nama && 
                   detail.email === currentUser.email && 
                   detail.nomorTelepon === currentUser.nomorTelepon;
          });
        }
        return false;
      });
      setHasUsedAccountDetails(hasUsed);
    } catch (error) {
      console.error('Error checking account details usage:', error);
      setHasUsedAccountDetails(false);
    }
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatHarga = (harga: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(harga);
  };

  const isBuyerDetailsComplete = () => {
    if (!buyerDetails || buyerDetails.length === 0) return false;
    
    // Check if all required fields are filled
    for (const detail of buyerDetails) {
      if (!detail.useAccountDetails) {
        if (!detail.nama || !detail.email || !detail.nomorTelepon) {
          return false;
        }
      }
    }
    return true;
  };

  const updateBuyerDetail = (index: number, field: keyof BuyerDetail, value: string | boolean) => {
    setBuyerDetails(prev => prev.map((detail, i) => {
      if (i === index) {
        const updated = { ...detail, [field]: value };
        
        // Handle useAccountDetails toggle
        if (field === 'useAccountDetails') {
          if (value && hasUsedAccountDetails) {
            // User has used account details before, don't allow
            alert('Anda sudah pernah menggunakan detail akun untuk pembelian sebelumnya. Silakan isi detail secara manual untuk tiket ini.');
            return detail; // Don't change
          }
          
          if (value) {
            // When enabling, disable all other tickets that might be using account details
            // This will be handled by the return logic below
            const currentUser = authService.getCurrentUser();
            console.log('Current user data:', currentUser); // Debug log
            
            if (!currentUser) {
              alert('Data akun tidak ditemukan. Silakan login kembali.');
              return detail;
            }
            
            if (!currentUser.nama || !currentUser.email || !currentUser.nomorTelepon) {
              alert('Data akun tidak lengkap. Silakan lengkapi profil Anda terlebih dahulu.');
              return detail;
            }
            
            updated.nama = currentUser.nama;
            updated.email = currentUser.email;
            updated.nomorTelepon = currentUser.nomorTelepon;
            console.log('Updated detail with account data:', updated); // Debug log
          } else {
            // Clear fields when unchecked
            updated.nama = '';
            updated.email = '';
            updated.nomorTelepon = '';
          }
        }
        
        return updated;
      } else if (field === 'useAccountDetails' && value) {
        // If enabling for current ticket, disable all others
        return { ...detail, useAccountDetails: false, nama: '', email: '', nomorTelepon: '' };
      }
      
      return detail;
    }));
  };

  const handlePromoCodeApplied = (promoCode: any, discountAmount: number, finalTotal: number) => {
    setAppliedPromoCode(promoCode);
    setCurrentTotal(finalTotal);
  };

  const handlePromoCodeRemoved = () => {
    setAppliedPromoCode(null);
    setCurrentTotal(order?.totalHarga || 0);
  };

  const handleSubmitDetails = async () => {
    // Simple validation - ensure all required fields are filled
    for (let i = 0; i < buyerDetails.length; i++) {
      const detail = buyerDetails[i];
      if (!detail.nama || detail.nama.trim() === '') {
        alert(`Mohon isi nama untuk tiket ${i + 1}`);
        return;
      }
      if (!detail.email || detail.email.trim() === '') {
        alert(`Mohon isi email untuk tiket ${i + 1}`);
        return;
      }
      if (!detail.nomorTelepon || detail.nomorTelepon.trim() === '') {
        alert(`Mohon isi nomor telepon untuk tiket ${i + 1}`);
        return;
      }
    }

    setSubmittingDetails(true);
    try {
      console.log('Sending buyerDetails:', buyerDetails); // Debug log
      await api.put(`/orders/${params.id}/buyer-details`, { buyerDetails });
      // Refresh order
      await fetchOrder();
    } catch (error: any) {
      console.error('Error saving buyer details:', error.response?.data); // Debug log
      alert(error.response?.data?.message || 'Gagal menyimpan detail pembeli. Silakan coba lagi.');
    } finally {
      setSubmittingDetails(false);
    }
  };

  const handlePayment = async () => {
    if (!snapReady || !window.snap) {
      alert('Snap belum siap, mohon tunggu sebentar...');
      return;
    }

    setProcessing(true);

    try {
      const response = await api.post('/payment/create', {
        orderId: order!._id,
      });

      if (!response.data.token) {
        throw new Error('Token tidak ditemukan dalam response');
      }

      // Buka Snap popup
      window.snap.pay(response.data.token, {
        onSuccess: function(result: any) {
          alert('Pembayaran berhasil! Tiket Anda sudah tersedia.');
          router.push('/my-tickets');
        },
        onPending: function(result: any) {
          alert('Pembayaran sedang diproses. Silakan selesaikan pembayaran Anda.');
          setProcessing(false);
        },
        onError: function(result: any) {
          alert('Pembayaran gagal. Silakan coba lagi atau gunakan metode pembayaran lain.');
          setProcessing(false);
        },
        onClose: function() {
          setProcessing(false);
        }
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Pesanan tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Midtrans Snap Script */}
      <Script
        src="https://app.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapReady(true)}
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold text-white">Ringkasan Pesanan</h1>
            <p className="text-blue-100">Silakan cek kembali detail pesanan Anda</p>
          </div>

          <div className="p-6">
            {/* Event Info */}
            <div className="mb-6 pb-6 border-b">
              <h2 className="font-bold text-lg mb-4 text-gray-900">Detail Event</h2>
              <div className="flex gap-4">
                <img
                  src={order.event.gambar}
                  alt={order.event.nama}
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/images/default-event.jpg';
                  }}
                />
                <div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{order.event.nama}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📅 {formatTanggal(order.event.tanggal)}</p>
                    <p>🕐 {order.event.waktu}</p>
                    <p>📍 {order.event.lokasi}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="mb-6 pb-6 border-b">
              <h2 className="font-bold text-lg mb-4 text-gray-900">Informasi Pembeli</h2>
              {order.buyerDetails && order.buyerDetails.length > 0 ? (
                // Display buyer details
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
                    <p className="text-green-800 text-sm">
                      ✅ Detail pembeli telah disimpan
                    </p>
                  </div>
                  {order.buyerDetails.map((detail, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-gray-900">Tiket #{index + 1}</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nama</p>
                          <p className="font-semibold text-gray-900">{detail.nama}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900">{detail.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Nomor Telepon</p>
                          <p className="font-semibold text-gray-900">{detail.nomorTelepon}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : buyerDetails.length > 0 ? (
                // Form to input buyer details
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Silakan lengkapi detail pembeli untuk setiap tiket sebelum melanjutkan pembayaran
                    </p>
                    {hasUsedAccountDetails && (
                      <p className="text-red-700 text-sm mt-1">
                        ⚠️ Anda sudah pernah menggunakan detail akun untuk pembelian sebelumnya. Opsi "Gunakan detail dari akun saya" tidak tersedia.
                      </p>
                    )}
                    {!hasUsedAccountDetails && (
                      <p className="text-blue-700 text-sm mt-1">
                        💡 Opsi "Gunakan detail dari akun saya" hanya bisa digunakan untuk 1 tiket per pesanan dan tidak bisa digunakan lagi untuk pembelian selanjutnya.
                      </p>
                    )}
                  </div>
                  {buyerDetails.map((detail, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4 text-gray-900">Detail Pembeli Tiket #{index + 1}</h3>
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={detail.useAccountDetails || false}
                            onChange={(e) => updateBuyerDetail(index, 'useAccountDetails', e.target.checked)}
                            disabled={hasUsedAccountDetails || (!detail.useAccountDetails && buyerDetails.some(d => d.useAccountDetails))}
                            className="mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`text-sm ${hasUsedAccountDetails || (!detail.useAccountDetails && buyerDetails.some(d => d.useAccountDetails)) ? 'text-gray-500' : 'text-gray-700'}`}>
                            Gunakan detail dari akun saya
                            {hasUsedAccountDetails && (
                              <span className="text-red-500 ml-1">(sudah digunakan sebelumnya)</span>
                            )}
                            {!hasUsedAccountDetails && !detail.useAccountDetails && buyerDetails.some(d => d.useAccountDetails) && (
                              <span className="text-orange-500 ml-1">(sudah digunakan untuk tiket lain)</span>
                            )}
                          </span>
                        </label>
                        {!hasUsedAccountDetails && (
                          <p className="text-xs text-gray-500 mt-1">
                            * Hanya bisa digunakan untuk 1 tiket per pesanan dan tidak bisa digunakan lagi untuk pembelian selanjutnya
                          </p>
                        )}
                        {hasUsedAccountDetails && (
                          <p className="text-xs text-red-500 mt-1">
                            * Opsi ini tidak tersedia karena sudah pernah digunakan untuk pembelian sebelumnya
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Nama</label>
                          <input
                            type="text"
                            value={detail.nama}
                            onChange={(e) => updateBuyerDetail(index, 'nama', e.target.value)}
                            disabled={detail.useAccountDetails}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                          <input
                            type="email"
                            value={detail.email}
                            onChange={(e) => updateBuyerDetail(index, 'email', e.target.value)}
                            disabled={detail.useAccountDetails}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Masukkan email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Nomor Telepon</label>
                          <input
                            type="tel"
                            value={detail.nomorTelepon}
                            onChange={(e) => updateBuyerDetail(index, 'nomorTelepon', e.target.value)}
                            disabled={detail.useAccountDetails}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Masukkan nomor telepon"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleSubmitDetails}
                    disabled={submittingDetails}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submittingDetails ? 'Menyimpan...' : 'Simpan Detail Pembeli'}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Memuat detail pembeli...</p>
                </div>
              )}
            </div>

            {/* Promo Code */}
            {order.status === 'pending' && (
              <div className="mb-6 pb-6 border-b">
                <PromoCodeInput
                  onPromoCodeApplied={handlePromoCodeApplied}
                  onPromoCodeRemoved={handlePromoCodeRemoved}
                  orderTotal={order.totalHarga}
                  eventId={order.event._id}
                  appliedPromoCode={appliedPromoCode}
                />
              </div>
            )}

            {/* Payment Summary */}
            <div className="mb-6">
              <h2 className="font-bold text-lg mb-4 text-gray-900">Rincian Pembayaran</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-900">Harga Tiket x {order.jumlahTiket}</span>
                  <span className="font-semibold text-gray-900">{formatHarga(order.totalHarga)}</span>
                </div>
                {appliedPromoCode && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon ({appliedPromoCode.code})</span>
                    <span className="font-semibold">-{formatHarga(order.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatHarga(currentTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            {order.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <p className="text-yellow-800">
                  ⏳ Pesanan Anda menunggu pembayaran
                </p>
              </div>
            )}

            {order.status === 'paid' && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                <p className="text-green-800">
                  ✅ Pembayaran berhasil! Tiket Anda sudah tersedia
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {order.status === 'pending' && (
                <>
                  {!isBuyerDetailsComplete() && buyerDetails.length > 0 && (
                    <div className="flex-1 bg-gray-300 text-gray-500 py-3 rounded-lg font-medium text-center">
                      Lengkapi detail pembeli terlebih dahulu
                    </div>
                  )}
                  {isBuyerDetailsComplete() && (
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {processing ? 'Memproses...' : 'Bayar Sekarang'}
                    </button>
                  )}
                </>
              )}

              {order.status === 'paid' && (
                <button
                  onClick={() => router.push('/my-tickets')}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Lihat Tiket Saya
                </button>
              )}

              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
