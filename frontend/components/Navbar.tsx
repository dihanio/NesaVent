'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-md py-3'
          : 'bg-white py-5'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
              NESAVENT
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium transition hover:text-blue-600 ${pathname === '/' ? 'text-blue-600' : 'text-gray-600'
                }`}
            >
              Beranda
            </Link>
            <Link
              href="/events"
              className={`font-medium transition hover:text-blue-600 ${pathname === '/events' ? 'text-blue-600' : 'text-gray-600'
                }`}
            >
              Jelajahi Event
            </Link>

            {user ? (
              <div className="flex items-center gap-6">
                {(user.role === 'mitra' || user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="font-medium text-gray-600 hover:text-blue-600 transition"
                  >
                    Dashboard
                  </Link>
                )}

                <div className="relative group">
                  <button className="flex items-center gap-3 p-1 pr-3 rounded-full border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-bold text-gray-700 leading-none">{user.nama.split(' ')[0]}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{user.role}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-4 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <p className="font-bold text-gray-900 truncate">{user.nama}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                      <Link href="/my-tickets" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition">
                        <span className="mr-3 text-lg">🎫</span> Tiket Saya
                      </Link>
                      <Link href="/my-orders" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition">
                        <span className="mr-3 text-lg">📋</span> Pesanan Saya
                      </Link>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <span className="mr-3 text-lg">🚪</span> Keluar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="font-bold text-gray-600 hover:text-blue-600 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 transform hover:-translate-y-0.5"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-2">
            <Link
              href="/"
              className={`p-3 rounded-xl font-medium ${pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              🏠 Beranda
            </Link>
            <Link
              href="/events"
              className={`p-3 rounded-xl font-medium ${pathname === '/events' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              🔍 Jelajahi Event
            </Link>

            {user ? (
              <>
                <div className="h-px bg-gray-100 my-2"></div>
                <div className="px-3 py-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{user.nama}</p>
                    <p className="text-xs text-gray-500 uppercase">{user.role}</p>
                  </div>
                </div>

                {(user.role === 'mitra' || user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="p-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
                )}
                <Link
                  href="/my-tickets"
                  className="p-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🎫 Tiket Saya
                </Link>
                <Link
                  href="/my-orders"
                  className="p-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  📋 Pesanan Saya
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="p-3 rounded-xl font-medium text-red-600 hover:bg-red-50 text-left w-full"
                >
                  🚪 Keluar
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-gray-100 my-2"></div>
                <Link
                  href="/login"
                  className="p-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="p-3 rounded-xl font-bold bg-blue-600 text-white text-center shadow-lg shadow-blue-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
