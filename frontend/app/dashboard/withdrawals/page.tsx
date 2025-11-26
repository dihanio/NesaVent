'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatHarga, formatTanggal } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface Withdrawal {
  _id: string;
  jumlah: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  adminFee: number;
  jumlahDiterima: number;
  keterangan: string;
  alasanDitolak: string;
  createdAt: string;
  processedAt?: string;
  event?: {
    _id: string;
    nama: string;
  };
}

interface Balance {
  totalPendapatan: number;
  totalDitarik: number;
  totalPending: number;
  saldoTersedia: number;
  orders: number;
}

interface EventEarning {
  eventId: string;
  eventNama: string;
  totalPendapatan: number;
  totalTiketTerjual: number;
  totalOrder: number;
  status: string;
}

export default function WithdrawalPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [eventEarnings, setEventEarnings] = useState<EventEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    jumlah: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    eventId: '',
    keterangan: ''
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
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching withdrawal data...');
      const user = authService.getCurrentUser();
      console.log('Current user:', user);
      
      if (!user || (user.role !== 'mitra' && user.role !== 'admin')) {
        alert('Anda harus login sebagai mitra untuk mengakses halaman ini');
        router.push('/login');
        return;
      }

      const [withdrawalsRes, balanceRes, earningsRes] = await Promise.all([
        api.get('/withdrawals'),
        api.get('/withdrawals/balance'),
        api.get('/withdrawals/events')
      ]);
      
      setWithdrawals(withdrawalsRes.data);
      setBalance(balanceRes.data);
      setEventEarnings(earningsRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 403) {
        alert('Akses ditolak. Halaman ini hanya untuk mitra.');
        router.push('/dashboard');
      } else if (error.response?.status === 401) {
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        authService.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        jumlah: parseInt(formData.jumlah),
        eventId: formData.eventId || undefined
      };

      await api.post('/withdrawals', data);
      alert('Permintaan penarikan dana berhasil diajukan!');
      setShowModal(false);
      setFormData({
        jumlah: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        eventId: '',
        keterangan: ''
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengajukan penarikan');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Yakin ingin membatalkan penarikan ini?')) return;

    try {
      await api.delete(`/withdrawals/${id}`);
      alert('Penarikan berhasil dibatalkan');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal membatalkan penarikan');
    }
  };

  const calculateAdminFee = (amount: number) => {
    return Math.floor(amount * 0.025);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat data penarikan...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-8 mb-8 border-2 border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-green-600">Penarikan Dana</h1>
              </div>
              <p className="text-gray-600 text-lg ml-15">Kelola pendapatan dan tarik dana dari penjualan tiket</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={!balance || balance.saldoTersedia < 10000}
              className="bg-linear-to-r from-green-600 to-green-700 text-white px-6 py-3.5 rounded-xl hover:from-green-700 hover:to-green-800 transition flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tarik Dana
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        {balance && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Saldo Tersedia</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{formatHarga(balance.saldoTersedia)}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-2">Siap ditarik</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Pendapatan</p>
              <p className="text-3xl font-bold text-blue-600">{formatHarga(balance.totalPendapatan)}</p>
              <p className="text-sm text-gray-400 mt-2">{balance.orders} transaksi</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">Sedang Diproses</p>
              <p className="text-3xl font-bold text-yellow-600">{formatHarga(balance.totalPending)}</p>
              <p className="text-sm text-gray-400 mt-2">Menunggu verifikasi</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Ditarik</p>
              <p className="text-3xl font-bold text-gray-600">{formatHarga(balance.totalDitarik)}</p>
              <p className="text-sm text-gray-400 mt-2">Berhasil dicairkan</p>
            </div>
          </div>
        )}

        {/* Event Earnings */}
        {eventEarnings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border-2 border-blue-100">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Pendapatan Per Event
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventEarnings.map((event) => (
                <div key={event.eventId} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 transition">
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-1">{event.eventNama}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pendapatan:</span>
                      <span className="font-bold text-green-600">{formatHarga(event.totalPendapatan)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tiket Terjual:</span>
                      <span className="font-semibold text-gray-900">{event.totalTiketTerjual}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Order:</span>
                      <span className="font-semibold text-gray-900">{event.totalOrder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdrawal History */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Riwayat Penarikan
          </h2>

          {withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Bank</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Jumlah</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Admin Fee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Diterima</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatTanggal(withdrawal.createdAt)}</div>
                        {withdrawal.event && (
                          <div className="text-xs text-gray-500">{withdrawal.event.nama}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{withdrawal.bankName}</div>
                        <div className="text-xs text-gray-500">{withdrawal.accountNumber}</div>
                        <div className="text-xs text-gray-500">{withdrawal.accountName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">{formatHarga(withdrawal.jumlah)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600">-{formatHarga(withdrawal.adminFee)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">{formatHarga(withdrawal.jumlahDiterima)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-lg ${
                            withdrawal.status === 'completed'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : withdrawal.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : withdrawal.status === 'rejected'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {withdrawal.status === 'pending' && 'Menunggu'}
                            {withdrawal.status === 'processing' && 'Diproses'}
                            {withdrawal.status === 'completed' && 'Selesai'}
                            {withdrawal.status === 'rejected' && 'Ditolak'}
                          </span>
                          {withdrawal.status === 'rejected' && withdrawal.alasanDitolak && (
                            <div className="text-xs text-red-600">{withdrawal.alasanDitolak}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {withdrawal.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(withdrawal._id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-xs"
                          >
                            Batalkan
                          </button>
                        )}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Penarikan</h3>
              <p className="text-gray-600">Riwayat penarikan dana Anda akan muncul di sini</p>
            </div>
          )}
        </div>

        {/* Withdrawal Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-linear-to-r from-green-600 to-green-700 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tarik Dana
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:text-gray-200 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Saldo Info */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Saldo Tersedia:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {balance && formatHarga(balance.saldoTersedia)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">Minimal penarikan: Rp 10.000</p>
                </div>

                {/* Event Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Event (Opsional)
                  </label>
                  <select
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition"
                  >
                    <option value="">Semua Event</option>
                    {eventEarnings.map((event) => (
                      <option key={event.eventId} value={event.eventId}>
                        {event.eventNama} - {formatHarga(event.totalPendapatan)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Kosongkan untuk tarik dana dari semua event</p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Jumlah Penarikan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    max={balance?.saldoTersedia}
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition"
                    placeholder="Masukkan jumlah"
                  />
                  {formData.jumlah && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Jumlah:</span>
                        <span className="font-semibold">{formatHarga(parseInt(formData.jumlah))}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Admin Fee (2.5%):</span>
                        <span className="text-red-600">-{formatHarga(calculateAdminFee(parseInt(formData.jumlah)))}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                        <span className="text-gray-900">Anda Terima:</span>
                        <span className="text-green-600">{formatHarga(parseInt(formData.jumlah) - calculateAdminFee(parseInt(formData.jumlah)))}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Bank <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition"
                  >
                    <option value="">Pilih Bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Permata">Permata</option>
                    <option value="Danamon">Danamon</option>
                    <option value="BTN">BTN</option>
                    <option value="BSI">BSI</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nomor Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition"
                    placeholder="Contoh: 1234567890"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition"
                    placeholder="Sesuai dengan rekening"
                  />
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Keterangan (Opsional)
                  </label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition resize-none"
                    rows={3}
                    placeholder="Catatan tambahan..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition font-semibold shadow-lg"
                  >
                    Ajukan Penarikan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
