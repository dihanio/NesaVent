'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Update user state saat component mount atau pathname berubah
    setUser(authService.getCurrentUser());
  }, [pathname]);

  const handleLogout = () => {
    authService.logout();
  };

  // Hide navbar di halaman dashboard (sudah ada sidebar)
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className="bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition duration-200">
            NESAVENT
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-blue-200 transition duration-200 font-medium">
              Beranda
            </Link>
            {user ? (
              <>
                {(user.role === 'mitra' || user.role === 'admin') && (
                  <Link href="/dashboard" className="hover:text-blue-200 transition duration-200 font-medium">
                    Dashboard
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center space-x-3 hover:text-blue-200 transition duration-200 p-2 rounded-lg hover:bg-blue-500/20">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center font-bold text-sm">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-sm font-medium">{user.nama}</div>
                      <div className="text-xs opacity-75 capitalize">{user.role}</div>
                    </div>
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user.nama}</div>
                      <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <Link
                      href="/my-tickets"
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition duration-150"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      Tiket Saya
                    </Link>
                    <Link
                      href="/my-orders"
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition duration-150"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Pesanan Saya
                    </Link>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition duration-150"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="hover:text-blue-200 transition duration-200 font-medium"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition duration-200 font-medium shadow-md"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-blue-500/20 transition duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-blue-500/30 pt-4">
            <Link
              href="/"
              className="block py-3 hover:text-blue-200 transition duration-200 font-medium"
            >
              🏠 Beranda
            </Link>
            {user ? (
              <>
                {(user.role === 'mitra' || user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="block py-3 hover:text-blue-200 transition duration-200 font-medium"
                  >
                    📊 Dashboard
                  </Link>
                )}
                <Link
                  href="/my-tickets"
                  className="block py-3 hover:text-blue-200 transition duration-200 font-medium"
                >
                  🎫 Tiket Saya
                </Link>
                <Link
                  href="/my-orders"
                  className="block py-3 hover:text-blue-200 transition duration-200 font-medium"
                >
                  📋 Pesanan Saya
                </Link>
                <div className="flex items-center gap-3 py-3 border-t border-blue-500/30 mt-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center font-bold">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{user.nama}</div>
                    <div className="text-sm opacity-75 capitalize">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-3 text-red-300 hover:text-red-200 transition duration-200 font-medium"
                >
                  🚪 Keluar
                </button>
              </>
            ) : (
              <div className="space-y-2 border-t border-blue-500/30 pt-3 mt-3">
                <Link
                  href="/login"
                  className="block py-3 hover:text-blue-200 transition duration-200 font-medium"
                >
                  🔐 Masuk
                </Link>
                <Link
                  href="/register"
                  className="block py-3 bg-white text-blue-600 rounded-lg text-center hover:bg-blue-50 transition duration-200 font-medium"
                >
                  📝 Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
