'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
  _id: string;
  nama: string;
  email: string;
  role: 'user' | 'mitra' | 'admin';
  createdAt: string;
  isVerified: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'mitra' | 'admin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(currentUser);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'mitra' | 'admin') => {
    if (!confirm(`Yakin ingin mengubah role user ini menjadi ${newRole}?`)) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(); // Refresh data
      alert('Role berhasil diubah');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengubah role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Yakin ingin menghapus user "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers(); // Refresh data
      alert('User berhasil dihapus');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat data pengguna...</p>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">Manajemen Pengguna</h1>
              </div>
              <p className="text-gray-600 text-sm md:text-base lg:text-lg ml-0 md:ml-15">Kelola semua pengguna platform</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="w-full lg:w-auto">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Filter & Cari</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
                {[
                  { label: 'Semua', value: 'all' as const },
                  { label: 'User', value: 'user' as const },
                  { label: 'Mitra', value: 'mitra' as const },
                  { label: 'Admin', value: 'admin' as const },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterRole(filter.value)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${
                      filterRole === filter.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                    {filter.value !== 'all' && (
                      <span className="ml-2 text-xs opacity-75">
                        ({users.filter(u => u.role === filter.value).length})
                      </span>
                    )}
                    {filter.value === 'all' && (
                      <span className="ml-2 text-xs opacity-75">
                        ({users.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-64">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cari Pengguna
              </label>
              <input
                type="text"
                placeholder="Nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 font-medium bg-white"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
          <div className="px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-blue-50 to-yellow-50 border-b-2 border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-blue-600">Daftar Pengguna</h2>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Kelola role dan status pengguna</p>
                </div>
              </div>
            </div>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Bergabung
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((userData) => (
                    <tr key={userData._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-yellow-100 rounded-xl flex items-center justify-center shrink-0 border-2 border-blue-100 shadow-md">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{userData.nama}</div>
                            <div className="text-xs text-gray-500">{userData.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={userData.role}
                          onChange={(e) => handleRoleChange(userData._id, e.target.value as 'user' | 'mitra' | 'admin')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                            userData.role === 'admin' 
                              ? 'bg-red-100 text-red-700 border-red-200' 
                              : userData.role === 'mitra'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="mitra">Mitra</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-lg ${
                          userData.isVerified 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {userData.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(userData.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleDeleteUser(userData._id, userData.nama)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-xs"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm ? 'Tidak Ada Pengguna Ditemukan' : 'Belum Ada Pengguna'}
              </h3>
              <p className="text-gray-600 text-base mb-8 max-w-md mx-auto">
                {searchTerm 
                  ? 'Coba ubah kata kunci pencarian atau filter yang berbeda.'
                  : 'Belum ada pengguna yang terdaftar di platform.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}