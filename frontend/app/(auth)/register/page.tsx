'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    nomorTelepon: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMahasiswaEmail, setIsMahasiswaEmail] = useState(false);

  useEffect(() => {
    // Redirect ke homepage jika sudah login
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    // Deteksi email mahasiswa
    const isMhs = formData.email.endsWith('@mhs.unesa.ac.id');
    setIsMahasiswaEmail(isMhs);
  }, [formData.email]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi password
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...data } = formData;
      await authService.register(data);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';

      // Jika email sudah terdaftar, redirect ke login
      if (errorMessage.includes('Email sudah terdaftar')) {
        alert('Email sudah terdaftar. Anda akan diarahkan ke halaman login.');
        router.push('/login');
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Side - Image */}
          <div className="hidden md:block relative bg-blue-600">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
              alt="Register Illustration"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center text-white p-8"><svg class="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><h2 class="text-2xl font-bold mb-2">Bergabunglah dengan NESAVENT</h2><p class="text-blue-100">Mulai petualangan event Anda</p></div></div>';
              }}
            />
          </div>

          {/* Right Side - Form */}
          <div className="p-8">
            <div>
              <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
                Daftar ke NESAVENT
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Masuk di sini
                </Link>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  value={formData.nama}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {isMahasiswaEmail && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Email mahasiswa terdeteksi - Anda akan terdaftar sebagai Mahasiswa
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="nomorTelepon" className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  id="nomorTelepon"
                  name="nomorTelepon"
                  type="tel"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="08xxxxxxxxxx"
                  value={formData.nomorTelepon}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>

              {/* Info untuk mitra */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Ingin menjadi <span className="font-semibold">Mitra Organisasi</span>?{' '}
                  <Link href="/mitra/apply" className="text-blue-600 hover:text-blue-700 font-medium">
                    Ajukan di sini
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
