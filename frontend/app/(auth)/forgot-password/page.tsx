'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        console.log('🔐 Forgot Password - Submitting for:', email);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            console.log('✅ Forgot Password - Success:', response.data);
            setStatus('success');
            setMessage(response.data.message || 'Email reset password telah dikirim');
        } catch (error: any) {
            console.error('❌ Forgot Password - Error:', error.response?.data || error.message);
            setStatus('error');

            // Show more informative error message
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
            const errorDetail = error.response?.data?.error;

            if (errorDetail) {
                setMessage(`${errorMessage}\n\nDetail: ${errorDetail}`);
                console.error('Error detail:', errorDetail);
            } else {
                setMessage(errorMessage);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    {/* Left Side - Image */}
                    <div className="hidden md:block relative bg-blue-600">
                        <img
                            src="/images/login-illustration.jpg"
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
                                Lupa Password
                            </h2>
                            <p className="text-center text-gray-600 mb-8">
                                Masukkan email Anda untuk menerima link reset password.
                            </p>
                        </div>

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
                                    Email Terkirim
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">{message}</p>
                                <Link
                                    href="/login"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                >
                                    Kembali ke Login
                                </Link>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {status === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                        {message}
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="nama@email.com"
                                    />
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {status === 'loading' ? 'Memproses...' : 'Kirim Link Reset'}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <Link
                                        href="/login"
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Kembali ke Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
