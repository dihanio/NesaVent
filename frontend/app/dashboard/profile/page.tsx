'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
  _id: string;
  nama: string;
  email: string;
  nomorTelepon?: string;
  role: 'user' | 'mitra' | 'admin';
  organisasi?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    nomorTelepon: '',
    organisasi: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      setFormData({
        nama: response.data.nama,
        email: response.data.email,
        nomorTelepon: response.data.nomorTelepon || '',
        organisasi: response.data.organisasi || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.put('/auth/profile', formData);
      
      // Update localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setUser(response.data);
      setEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal memperbarui profil');
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

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { color: 'bg-red-100 text-red-700 border-red-200', icon: '👑', label: 'Admin' },
      mitra: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🤝', label: 'Mitra' },
      user: { color: 'bg-green-100 text-green-700 border-green-200', icon: '👤', label: 'User' }
    };
    return badges[role as keyof typeof badges] || badges.user;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat profil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Gagal memuat profil</p>
        </div>
      </DashboardLayout>
    );
  }

  const badge = getRoleBadge(user.role);

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-2xl p-8 mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-blue-600">Profil Saya</h1>
          </div>
          <p className="text-gray-600 text-lg ml-15">Kelola informasi akun dan keamanan Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100">
              <div className="text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-linear-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-xl mb-4">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{user.nama}</h2>
                <p className="text-sm md:text-base text-gray-600 mb-4">{user.email}</p>
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 shadow-md mb-6 ${badge.color}`}>
                  <span className="text-xl">{badge.icon}</span>
                  <span className="font-bold">{badge.label}</span>
                </div>

                {user.organisasi && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-100">
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-semibold">{user.organisasi}</span>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-6">
                  <p>Bergabung sejak</p>
                  <p className="font-semibold text-gray-700">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-100">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Informasi Profil
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-xs md:text-sm"
                  >
                    Edit Profil
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={formData.nomorTelepon}
                      onChange={(e) => setFormData({ ...formData, nomorTelepon: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  {(user.role === 'mitra' || user.role === 'admin') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Organisasi
                      </label>
                      <input
                        type="text"
                        value={formData.organisasi}
                        onChange={(e) => setFormData({ ...formData, organisasi: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                        placeholder="Nama organisasi/perusahaan"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-lg"
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          nama: user.nama,
                          email: user.email,
                          nomorTelepon: user.nomorTelepon || '',
                          organisasi: user.organisasi || ''
                        });
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Nama Lengkap</p>
                    <p className="font-semibold text-gray-900">{user.nama}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>
                  {user.nomorTelepon && (
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Nomor Telepon</p>
                      <p className="font-semibold text-gray-900">{user.nomorTelepon}</p>
                    </div>
                  )}
                  {user.organisasi && (
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Organisasi</p>
                      <p className="font-semibold text-gray-900">{user.organisasi}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Keamanan Akun
                </h3>
                {!changingPassword && (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold text-sm"
                  >
                    Ubah Password
                  </button>
                )}
              </div>

              {changingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Password Lama <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 transition"
                      placeholder="Masukkan password lama"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Password Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 transition"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Konfirmasi Password Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 transition"
                      placeholder="Ketik ulang password baru"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition font-semibold shadow-lg"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-yellow-800 mb-1">Password Terenkripsi</p>
                      <p className="text-sm text-yellow-700">
                        Password Anda tersimpan dengan aman menggunakan enkripsi. Klik tombol "Ubah Password" untuk mengubahnya.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-red-600 flex items-center gap-3 mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Zona Bahaya
              </h3>
              <p className="text-gray-600 mb-4">
                Tindakan di bawah ini tidak dapat dibatalkan. Harap berhati-hati.
              </p>
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin logout?')) {
                    authService.logout();
                  }
                }}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout dari Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
