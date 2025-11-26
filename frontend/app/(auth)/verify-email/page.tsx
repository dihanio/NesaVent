'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';

function VerifyEmailComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');

  const [code, setCode] = useState('');
  const [email, setEmail] = useState(emailFromQuery || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!/^\d{6}$/.test(code)) {
      setError('Kode harus berupa 6 digit angka.');
      setLoading(false);
      return;
    }

    try {
      await authService.verifyCode(email, code);
      // Redirect to dashboard on successful verification
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verifikasi gagal. Kode salah atau sudah kedaluwarsa.');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authService.resendVerificationCode(email);
      setSuccess('Kode verifikasi baru telah dikirim ke email Anda.');
      setResendCooldown(60); // 60 detik cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang kode.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verifikasi Email Anda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Kami telah mengirimkan kode verifikasi ke <strong>{email}</strong>. Silakan periksa inbox Anda.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="code" className="sr-only">
                Kode Verifikasi
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                className="appearance-none rounded-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center tracking-[0.5em]"
                placeholder="------"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
           Tidak menerima kode?{' '}
          <button
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || loading}
            className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}s` : 'Kirim ulang kode'}
          </button>
        </div>
        <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-gray-600 hover:text-gray-800">
                Kembali ke Login
            </Link>
        </div>
      </div>
    </div>
  );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailComponent />
        </Suspense>
    )
}