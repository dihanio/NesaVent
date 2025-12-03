'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { getErrorMessage } from '@/lib/validation';
import { ErrorAlert } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect ke homepage jika sudah login
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(formData);
      router.push('/');
    } catch (err: any) {
      // Cek jika error karena akun belum terverifikasi
      if (err.response?.data?.code === 'ACCOUNT_NOT_VERIFIED') {
        // Redirect ke halaman verifikasi dengan membawa email
        router.push(`/verify-email?email=${formData.email}`);
      } else {
        setError(getErrorMessage(err));
      }
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
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop"
              alt="Login Illustration"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center text-white p-8"><svg class="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg><h2 class="text-2xl font-bold mb-2">NESAVENT</h2><p class="text-blue-100">Platform Tiket Event Terpercaya</p></div></div>';
              }}
            />
          </div>

          {/* Right Side - Form */}
          <div className="p-8">
            <div>
              <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
                Masuk ke NESAVENT
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Belum punya akun?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Daftar sekarang
                </Link>
              </p>
            </div>

            <ErrorAlert error={error} className="mb-4" onClose={() => setError('')} />

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Lupa password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
