'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
  createdAt: string;
}

interface Settings {
  _id: string;
  notifications: {
    email: {
      eventApproved: boolean;
      eventRejected: boolean;
      newOrder: boolean;
      withdrawalProcessed: boolean;
      withdrawalRejected: boolean;
      eventReminder: boolean;
    };
    push: {
      eventApproved: boolean;
      eventRejected: boolean;
      newOrder: boolean;
      withdrawalProcessed: boolean;
      withdrawalRejected: boolean;
      eventReminder: boolean;
    };
  };
  bankAccounts: BankAccount[];
  emailTemplates: {
    orderConfirmation: {
      enabled: boolean;
      subject: string;
      body: string;
    };
    eventReminder: {
      enabled: boolean;
      subject: string;
      body: string;
      daysBefore: number;
    };
  };
  eventDefaults: {
    kategori: string;
    lokasi: string;
    durasi: number;
    reminderDays: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    isPrimary: false
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isFetchingName, setIsFetchingName] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async (type: 'email' | 'push', field: string, value: boolean) => {
    try {
      const update = { [type]: { [field]: value } };
      await api.put('/settings/notifications', update);
      fetchSettings();
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const fetchAccountName = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || bankForm.accountNumber.length < 5) {
      return;
    }

    setIsFetchingName(true);
    try {
      const response = await api.post('/settings/bank-accounts/validate', {
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber
      });

      if (response.data.accountName) {
        setBankForm({ ...bankForm, accountName: response.data.accountName });
      }
    } catch (error: any) {
      console.error('Error fetching account name:', error);
    } finally {
      setIsFetchingName(false);
    }
  };

  const addBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    try {
      const response = await api.post('/settings/bank-accounts', bankForm);
      
      // Show warning if account name doesn't match
      if (response.data.warning) {
        alert(`⚠️ ${response.data.warning}`);
      }
      
      if (response.data.verifiedAccountName) {
        alert(`✅ Rekening berhasil ditambahkan!\n\nNama pemilik rekening: ${response.data.verifiedAccountName}`);
      }
      
      setBankForm({ bankName: '', accountNumber: '', accountName: '', isPrimary: false });
      setShowAddBank(false);
      fetchSettings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menambahkan rekening');
    } finally {
      setIsValidating(false);
    }
  };

  const deleteBankAccount = async (id: string) => {
    if (!confirm('Hapus rekening ini?')) return;
    try {
      await api.delete(`/settings/bank-accounts/${id}`);
      fetchSettings();
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
  };

  const setPrimaryAccount = async (id: string) => {
    try {
      await api.put(`/settings/bank-accounts/${id}`, { isPrimary: true });
      fetchSettings();
    } catch (error) {
      console.error('Error setting primary account:', error);
    }
  };

  const updateEventDefaults = async (field: string, value: any) => {
    try {
      await api.put('/settings/event-defaults', { [field]: value });
      fetchSettings();
    } catch (error) {
      console.error('Error updating event defaults:', error);
    }
  };

  const tabs = [
    { id: 'notifications', name: 'Notifikasi', icon: '🔔' },
    { id: 'bank', name: 'Rekening Bank', icon: '🏦' },
    { id: 'defaults', name: 'Default Event', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat pengaturan...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">⚙️ Pengaturan</h1>
          <p className="text-sm md:text-base text-gray-600">Kelola preferensi dan pengaturan akun Anda</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex gap-2 p-3 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && settings && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">📧 Notifikasi Email</h3>
                <div className="space-y-3">
                  {Object.entries(settings.notifications.email).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <span className="text-gray-700 font-medium">
                        {key === 'eventApproved' && 'Event Disetujui'}
                        {key === 'eventRejected' && 'Event Ditolak'}
                        {key === 'newOrder' && 'Pembelian Tiket Baru'}
                        {key === 'withdrawalProcessed' && 'Penarikan Dana Diproses'}
                        {key === 'withdrawalRejected' && 'Penarikan Dana Ditolak'}
                        {key === 'eventReminder' && 'Pengingat Event'}
                      </span>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateNotifications('email', key, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔔 Notifikasi Push</h3>
                <div className="space-y-3">
                  {Object.entries(settings.notifications.push).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <span className="text-gray-700 font-medium">
                        {key === 'eventApproved' && 'Event Disetujui'}
                        {key === 'eventRejected' && 'Event Ditolak'}
                        {key === 'newOrder' && 'Pembelian Tiket Baru'}
                        {key === 'withdrawalProcessed' && 'Penarikan Dana Diproses'}
                        {key === 'withdrawalRejected' && 'Penarikan Dana Ditolak'}
                        {key === 'eventReminder' && 'Pengingat Event'}
                      </span>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateNotifications('push', key, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bank Accounts Tab */}
          {activeTab === 'bank' && settings && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">🏦 Rekening Bank</h3>
                <button
                  onClick={() => setShowAddBank(!showAddBank)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  + Tambah Rekening
                </button>
              </div>

              {showAddBank && (
                <form onSubmit={addBankAccount} className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      <strong>ℹ️ Info:</strong> Nomor rekening akan divalidasi secara otomatis menggunakan sistem bank. Pastikan data yang Anda masukkan benar.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Bank</label>
                    <select
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Bank...</option>
                      <option value="BCA">BCA - Bank Central Asia</option>
                      <option value="MANDIRI">Mandiri - Bank Mandiri</option>
                      <option value="BNI">BNI - Bank Negara Indonesia</option>
                      <option value="BRI">BRI - Bank Rakyat Indonesia</option>
                      <option value="BTN">BTN - Bank Tabungan Negara</option>
                      <option value="CIMB">CIMB Niaga</option>
                      <option value="PERMATA">Permata Bank</option>
                      <option value="DANAMON">Danamon</option>
                      <option value="PANIN">Panin Bank</option>
                      <option value="MEGA">Bank Mega</option>
                      <option value="BSI">BSI - Bank Syariah Indonesia</option>
                      <option value="OCBC">OCBC NISP</option>
                      <option value="BUKOPIN">Bukopin</option>
                      <option value="MAYBANK">Maybank Indonesia</option>
                      <option value="BJB">BJB - Bank Jabar Banten</option>
                      <option value="BPD JABAR">BPD Jabar</option>
                      <option value="BPD JATENG">BPD Jateng</option>
                      <option value="BPD JATIM">BPD Jatim</option>
                      <option value="SEABANK">SeaBank</option>
                      <option value="JENIUS">Jenius</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="LINKAJA">LinkAja</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Rekening</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contoh: 1234567890"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                        onBlur={fetchAccountName}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        pattern="\d+"
                        required
                      />
                      {isFetchingName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Hanya angka, tanpa spasi atau karakter lain. Nama pemilik akan otomatis terisi.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Pemilik Rekening
                      {bankForm.accountName && (
                        <span className="ml-2 text-xs text-green-600 font-normal">✓ Terverifikasi dari bank</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Akan otomatis terisi setelah input nomor rekening"
                      value={bankForm.accountName}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      readOnly
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      disabled={isValidating}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isValidating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Memvalidasi...
                        </>
                      ) : (
                        '✓ Simpan & Validasi'
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddBank(false)} 
                      disabled={isValidating}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {settings.bankAccounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada rekening bank. Tambahkan rekening untuk penarikan dana.
                  </div>
                ) : (
                  settings.bankAccounts.map((account) => (
                    <div key={account._id} className={`p-4 rounded-lg border-2 ${account.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{account.bankName}</h4>
                            {account.isPrimary && (
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">
                                Utama
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 font-mono">{account.accountNumber}</p>
                          <p className="text-gray-600 text-sm">{account.accountName}</p>
                        </div>
                        <button
                          onClick={() => deleteBankAccount(account._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {!account.isPrimary && (
                        <button
                          onClick={() => setPrimaryAccount(account._id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Jadikan Rekening Utama
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}



          {/* Event Defaults Tab */}
          {activeTab === 'defaults' && settings && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Default Event</h3>
              <p className="text-gray-600 text-sm mb-4">Pengaturan default untuk mempercepat pembuatan event baru</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Favorit</label>
                  <select
                    value={settings.eventDefaults.kategori || ''}
                    onChange={(e) => updateEventDefaults('kategori', e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih kategori default...</option>
                    <option value="musik">🎵 Musik</option>
                    <option value="olahraga">⚽ Olahraga</option>
                    <option value="teknologi">💻 Teknologi</option>
                    <option value="seni">🎨 Seni</option>
                    <option value="pendidikan">📚 Pendidikan</option>
                    <option value="bisnis">💼 Bisnis</option>
                    <option value="lainnya">📌 Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi Default</label>
                  <input
                    type="text"
                    value={settings.eventDefaults.lokasi}
                    onChange={(e) => updateEventDefaults('lokasi', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Jakarta Convention Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Durasi Event Default (menit)</label>
                  <input
                    type="number"
                    value={settings.eventDefaults.durasi}
                    onChange={(e) => updateEventDefaults('durasi', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="30"
                    step="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">{settings.eventDefaults.durasi} menit = {Math.floor(settings.eventDefaults.durasi / 60)} jam {settings.eventDefaults.durasi % 60} menit</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pengingat Event (hari sebelumnya)</label>
                  <input
                    type="number"
                    value={settings.eventDefaults.reminderDays}
                    onChange={(e) => updateEventDefaults('reminderDays', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="30"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
