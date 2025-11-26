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
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            NESAVENT
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-blue-200 transition">
              Beranda
            </Link>
            {user ? (
              <>
                {(user.role === 'mitra' || user.role === 'admin') && (
                  <Link href="/dashboard" className="hover:text-blue-200 transition">
                    Dashboard Mitra
                  </Link>
                )}
                <Link href="/my-tickets" className="hover:text-blue-200 transition">
                  Tiket Saya
                </Link>
                <Link href="/my-orders" className="hover:text-blue-200 transition">
                  Pesanan Saya
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-3 hover:text-blue-200 transition">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-lg">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.nama}</span>
                    <svg
                      className="w-4 h-4"
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
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/my-orders"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/my-tickets"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Tiket Saya
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-200 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
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
          <div className="md:hidden pb-4">
            <Link
              href="/"
              className="block py-2 hover:text-blue-200 transition"
            >
              Beranda
            </Link>
            {user ? (
              <>
                {(user.role === 'mitra' || user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="block py-2 hover:text-blue-200 transition"
                  >
                    Dashboard Mitra
                  </Link>
                )}
                <Link
                  href="/my-tickets"
                  className="block py-2 hover:text-blue-200 transition"
                >
                  Tiket Saya
                </Link>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-lg">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-blue-200">Halo, {user.nama}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-300 hover:text-red-200 transition"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2 hover:text-blue-200 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="block py-2 hover:text-blue-200 transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
