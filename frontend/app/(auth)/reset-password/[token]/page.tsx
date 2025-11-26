'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordContent() {
    const router = useRouter();
    const params = useParams();
    const token = params.token;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        console.log('🔄 Reset Password - Page loaded with token:', token ? String(token).substring(0, 10) + '...' : 'NO TOKEN');

        if (!token) {
            console.error('❌ No reset token found in URL');
            setStatus('error');
            setMessage('Token reset password tidak ditemukan. Link tidak valid.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('🔄 Reset Password - Validating inputs');

        if (password !== confirmPassword) {
            console.error('❌ Passwords do not match');
            setStatus('error');
            setMessage('Password tidak cocok');
            return;
        }

        if (password.length < 6) {
            console.error('❌ Password too short');
            setStatus('error');
            setMessage('Password minimal 6 karakter');
            return;
        }

        setStatus('loading');
        setMessage('');

        console.log('🔄 Reset Password - Submitting...');

        try {
            const response = await api.put(`/auth/reset-password/${token}`, { password });
            console.log('✅ Reset Password - Success:', response.data);
            setStatus('success');
            setMessage(response.data.message || 'Password berhasil diubah');

            // Auto redirect to login after 3 seconds
            setTimeout(() => {
                console.log('🔄 Redirecting to login page...');
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            console.error('❌ Reset Password - Error:', error.response?.data || error.message);
            setStatus('error');

            // Show more informative error message
            const errorMessage = error.response?.data?.message || 'Gagal mereset password. Token mungkin sudah kadaluarsa.';
            const errorDetail = error.response?.data?.error;
            const isExpired = error.response?.data?.expired;

            if (isExpired) {
                setMessage(`${errorMessage}\n\nSilakan request forgot password lagi dari halaman login.`);
            } else if (errorDetail) {
                setMessage(`${errorMessage}\n\nDetail: ${errorDetail}`);
                console.error('Error detail:', errorDetail);
            } else {
                setMessage(errorMessage);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Reset Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Masukkan password baru Anda.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                                Password Berhasil Diubah
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">{message}</p>
                            <Link
                                href="/login"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Masuk Sekarang
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {status === 'error' && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-red-400"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">{message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Password Baru
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Konfirmasi Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {status === 'loading' ? 'Memproses...' : 'Ubah Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
