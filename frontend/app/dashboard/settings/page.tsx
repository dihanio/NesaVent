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

interface Tab {
  id: string;
  name: string;
  icon: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('account');
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    isPrimary: false
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isFetchingName, setIsFetchingName] = useState(false);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailNotifications: {
      user: {
        eventUpdates: true,
        ticketReminders: true
      },
      mitra: {
        ticketSales: true,
        withdrawalSuccess: true
      }
    }
  });

  useEffect(() => {
    const currentTabs = getTabs();
    if (user && currentTabs.length > 0 && !currentTabs.find((tab: Tab) => tab.id === activeTab)) {
      setActiveTab(currentTabs[0].id);
    }
  }, [user, activeTab]);

  const fetchUser = async () => {
    try {
      const userData = authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password baru minimal 6 karakter');
      return;
    }

    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setChangingPassword(false);
      alert('Password berhasil diubah!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengubah password');
    }
  };

  const updatePreferences = async (key: string, value: any) => {
    try {
      // For now, just update local state. In a real app, you'd save to backend
      setPreferences(prev => ({ ...prev, [key]: value }));
      alert('Preferensi berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating preferences:', error);
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

  // Dynamic tabs based on user role
  const getTabs = () => {
    if (!user) return [];

    const baseTabs = [
      { id: 'account', name: 'Akun & Keamanan', icon: '🔐' },
      { id: 'preferences', name: 'Preferensi', icon: '⚙️' }
    ];

    // Add billing tab only for mitra and admin
    if (user.role === 'mitra' || user.role === 'admin') {
      baseTabs.splice(1, 0, { id: 'billing', name: 'Keuangan', icon: '💳' });
    }

    return baseTabs;
  };

  // Get notification options based on user role
  const getNotificationOptions = () => {
    if (!user) return {};

    if (user.role === 'user') {
      // User notifications: event reminders and order updates
      return {
        email: {
          eventReminder: 'Pengingat Event',
          newOrder: 'Pembelian Tiket Baru'
        },
        push: {
          eventReminder: 'Pengingat Event',
          newOrder: 'Pembelian Tiket Baru'
        }
      };
    } else if (user.role === 'mitra') {
      // Mitra notifications: event approvals, sales, withdrawals
      return {
        email: {
          eventApproved: 'Event Disetujui',
          eventRejected: 'Event Ditolak',
          newOrder: 'Penjualan Tiket Baru',
          withdrawalProcessed: 'Penarikan Dana Diproses',
          withdrawalRejected: 'Penarikan Dana Ditolak'
        },
        push: {
          eventApproved: 'Event Disetujui',
          eventRejected: 'Event Ditolak',
          newOrder: 'Penjualan Tiket Baru',
          withdrawalProcessed: 'Penarikan Dana Diproses',
          withdrawalRejected: 'Penarikan Dana Ditolak'
        }
      };
    } else if (user.role === 'admin') {
      // Admin notifications: all notifications
      return {
        email: {
          eventApproved: 'Event Disetujui',
          eventRejected: 'Event Ditolak',
          newOrder: 'Pembelian/Penjualan Tiket',
          withdrawalProcessed: 'Penarikan Dana Diproses',
          withdrawalRejected: 'Penarikan Dana Ditolak',
          eventReminder: 'Pengingat Event'
        },
        push: {
          eventApproved: 'Event Disetujui',
          eventRejected: 'Event Ditolak',
          newOrder: 'Pembelian/Penjualan Tiket',
          withdrawalProcessed: 'Penarikan Dana Diproses',
          withdrawalRejected: 'Penarikan Dana Ditolak',
          eventReminder: 'Pengingat Event'
        }
      };
    }

    return {};
  };

  const notificationOptions = getNotificationOptions();

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
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Pengaturan</h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola preferensi dan pengaturan akun Anda</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 border-2 border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getTabs().map((tab: Tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
          {/* Account & Security Tab */}
          {activeTab === 'account' && (
            <div className="p-4 md:p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔐 Keamanan Akun</h3>

                {!changingPassword ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">Password</h4>
                          <p className="text-sm text-gray-600">Terakhir diubah 30 hari yang lalu</p>
                        </div>
                        <Button onClick={() => setChangingPassword(true)} variant="outline">
                          Ubah Password
                        </Button>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">🗑️ Hapus Akun</h4>
                      <p className="text-sm text-red-700 mb-4">
                        Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
                      </p>
                      <Button variant="destructive" className="w-full md:w-auto">
                        Hapus Akun Saya
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Password Lama</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1">
                        Simpan Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Billing Tab - Only for Mitra/Admin */}
          {activeTab === 'billing' && (user?.role === 'mitra' || user?.role === 'admin') && settings && (
            <div className="p-4 md:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">💳 Informasi Pencairan Dana</h3>
                <Button onClick={() => setShowAddBank(!showAddBank)}>
                  + Tambah Rekening
                </Button>
              </div>

              {showAddBank && (
                <form onSubmit={addBankAccount} className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      <strong>ℹ️ Info:</strong> Nomor rekening akan divalidasi secara otomatis menggunakan sistem bank. Pastikan data yang Anda masukkan benar.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bankName">Nama Bank</Label>
                    <select
                      id="bankName"
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
                    <Label htmlFor="accountNumber">Nomor Rekening</Label>
                    <div className="relative">
                      <Input
                        id="accountNumber"
                        placeholder="Contoh: 1234567890"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                        onBlur={fetchAccountName}
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
                    <Label htmlFor="accountName">
                      Nama Pemilik Rekening
                      {bankForm.accountName && (
                        <span className="ml-2 text-xs text-green-600 font-normal">✓ Terverifikasi dari bank</span>
                      )}
                    </Label>
                    <Input
                      id="accountName"
                      placeholder="Akan otomatis terisi setelah input nomor rekening"
                      value={bankForm.accountName}
                      readOnly
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isValidating} className="flex-1">
                      {isValidating ? 'Memvalidasi...' : '✓ Simpan & Validasi'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddBank(false)} disabled={isValidating}>
                      Batal
                    </Button>
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
                              <Badge variant="default">Utama</Badge>
                            )}
                          </div>
                          <p className="text-gray-700 font-mono">{account.accountNumber}</p>
                          <p className="text-gray-600 text-sm">{account.accountName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBankAccount(account._id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                      {!account.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrimaryAccount(account._id)}
                          className="text-sm"
                        >
                          Jadikan Rekening Utama
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="p-4 md:p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Preferensi</h3>

                {/* Theme Toggle */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">🎨 Tampilan</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={preferences.theme === 'light'}
                        onChange={(e) => updatePreferences('theme', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Terang</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={preferences.theme === 'dark'}
                        onChange={(e) => updatePreferences('theme', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Gelap</span>
                    </label>
                  </div>
                </div>

                {/* Email Notifications */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">📧 Notifikasi Email</h4>

                  {user?.role === 'user' ? (
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                        <span className="text-gray-700 font-medium">Info Event Terbaru</span>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications.user.eventUpdates}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            emailNotifications: {
                              ...prev.emailNotifications,
                              user: {
                                ...prev.emailNotifications.user,
                                eventUpdates: e.target.checked
                              }
                            }
                          }))}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                        <span className="text-gray-700 font-medium">Reminder Tiket</span>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications.user.ticketReminders}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            emailNotifications: {
                              ...prev.emailNotifications,
                              user: {
                                ...prev.emailNotifications.user,
                                ticketReminders: e.target.checked
                              }
                            }
                          }))}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                        <span className="text-gray-700 font-medium">Tiket Terjual</span>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications.mitra.ticketSales}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            emailNotifications: {
                              ...prev.emailNotifications,
                              mitra: {
                                ...prev.emailNotifications.mitra,
                                ticketSales: e.target.checked
                              }
                            }
                          }))}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                        <span className="text-gray-700 font-medium">Pencairan Dana Berhasil</span>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications.mitra.withdrawalSuccess}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            emailNotifications: {
                              ...prev.emailNotifications,
                              mitra: {
                                ...prev.emailNotifications.mitra,
                                withdrawalSuccess: e.target.checked
                              }
                            }
                          }))}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
