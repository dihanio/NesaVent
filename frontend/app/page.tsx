'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import api from '@/lib/api';

interface TicketType {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  stokTersisa: number;
  deskripsi?: string;
}

interface Event {
  _id: string;
  nama: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  kategori: string;
  harga: number;
  stok: number;
  gambar: string;
  penyelenggara: string;
  tiketTersedia?: TicketType[];
  totalStokTersisa?: number;
}

export default function Home() {
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [newestEvents, setNewestEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero carousel data
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=600&fit=crop',
      link: '/events'
    },
    {
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&h=600&fit=crop',
      link: '/events'
    },
    {
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&h=600&fit=crop',
      link: '/events'
    },
    {
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1920&h=600&fit=crop',
      link: '/events'
    }
  ];

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    fetchHomeEvents();
  }, []);

  const fetchHomeEvents = async () => {
    try {
      setLoading(true);

      // Fetch Popular Events (Limit 4)
      const popularRes = await api.get('/events', {
        params: { sort: 'popular', limit: 4 }
      });

      // Fetch Upcoming Events (Limit 4)
      const upcomingRes = await api.get('/events', {
        params: { sort: 'upcoming', limit: 4 }
      });

      // Fetch Newest Events (Limit 4)
      const newestRes = await api.get('/events', {
        params: { sort: 'newest', limit: 4 }
      });

      // Handle response format (check if data exists in .data or directly)
      const popularData = popularRes.data.data || popularRes.data;
      const upcomingData = upcomingRes.data.data || upcomingRes.data;
      const newestData = newestRes.data.data || newestRes.data;

      setPopularEvents(Array.isArray(popularData) ? popularData : []);
      setUpcomingEvents(Array.isArray(upcomingData) ? upcomingData : []);
      setNewestEvents(Array.isArray(newestData) ? newestData : []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Hero Carousel */}
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="relative w-full aspect-video md:aspect-21/9 overflow-hidden rounded-2xl shadow-2xl group">
          {/* Slides */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              onClick={() => window.location.href = slide.link}
              className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white">
                  <h2 className="text-3xl md:text-5xl font-bold mb-2">Temukan Event Seru!</h2>
                  <p className="text-lg opacity-90">Jelajahi ribuan event menarik di sekitarmu</p>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition z-10 opacity-0 group-hover:opacity-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition z-10 opacity-0 group-hover:opacity-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                className={`h-2 rounded-full transition-all ${index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-2 hover:bg-white/75'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto -mt-8 relative z-20">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari event impianmu..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/events?search=${(e.target as HTMLInputElement).value}`;
                  }
                }}
              />
              <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Link
              href="/events"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              Cari
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20 space-y-16">
        {/* Section: Recommended Events (Popular) */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl shadow-sm">
                🔥
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Rekomendasi Event
                </h2>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  Event paling populer yang banyak dilihat orang
                </p>
              </div>
            </div>
            <Link
              href="/events?sort=popular"
              className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition group"
            >
              Lihat Semua <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : popularEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">Belum ada event populer saat ini.</p>
            </div>
          )}

          <div className="mt-6 md:hidden text-center">
            <Link
              href="/events?sort=popular"
              className="inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-50 transition"
            >
              Lihat Semua Rekomendasi
            </Link>
          </div>
        </section>

        {/* Banner Ads 1 - Student Promo */}
        <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer transform hover:scale-[1.01] transition-all duration-300">
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
            alt="Student Promo"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Solid Overlay */}
          <div className="absolute inset-0 bg-blue-900/90"></div>

          <div className="relative h-full flex items-center justify-between px-6 md:px-12">
            <div className="text-white">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs md:text-sm font-semibold mb-2 border border-white/30">
                🎓 Khusus Mahasiswa
              </span>
              <h3 className="text-xl md:text-3xl font-bold mb-1">Diskon Tiket hingga 50%!</h3>
              <p className="text-blue-100 text-sm md:text-base">Gunakan email kampusmu untuk mendapatkan harga spesial.</p>
            </div>
            <div className="hidden md:block">
              <button className="px-6 py-2 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition transform group-hover:translate-x-1">
                Cek Sekarang →
              </button>
            </div>
          </div>
        </div>

        {/* Section: Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl shadow-sm">
                📅
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Event Terdekat
                </h2>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  Jangan sampai ketinggalan event yang akan segera mulai
                </p>
              </div>
            </div>
            <Link
              href="/events?sort=upcoming"
              className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition group"
            >
              Lihat Semua <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">Belum ada event terdekat.</p>
            </div>
          )}

          <div className="mt-6 md:hidden text-center">
            <Link
              href="/events?sort=upcoming"
              className="inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-50 transition"
            >
              Lihat Semua Event Terdekat
            </Link>
          </div>
        </section>

        {/* Banner Ads 2 - Partnership */}
        <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer transform hover:scale-[1.01] transition-all duration-300">
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
            alt="Partnership"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Solid Overlay */}
          <div className="absolute inset-0 bg-gray-900/90"></div>

          <div className="relative h-full flex items-center justify-between px-6 md:px-12">
            <div className="text-white">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs md:text-sm font-semibold mb-2 border border-white/30">
                🤝 Jadi Mitra
              </span>
              <h3 className="text-xl md:text-3xl font-bold mb-1">Buat Eventmu Sendiri!</h3>
              <p className="text-gray-300 text-sm md:text-base">Bergabunglah sebagai mitra dan kelola eventmu dengan mudah.</p>
            </div>
            <div className="hidden md:block">
              <button className="px-6 py-2 bg-white text-gray-900 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition transform group-hover:translate-x-1">
                Daftar Mitra →
              </button>
            </div>
          </div>
        </div>

        {/* Section: Newest Events */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl shadow-sm">
                ✨
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Event Terbaru
                </h2>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  Event-event fresh yang baru saja ditambahkan
                </p>
              </div>
            </div>
            <Link
              href="/events?sort=newest"
              className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition group"
            >
              Lihat Semua <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : newestEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newestEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">Belum ada event terbaru.</p>
            </div>
          )}

          <div className="mt-6 md:hidden text-center">
            <Link
              href="/events?sort=newest"
              className="inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-50 transition"
            >
              Lihat Semua Event Terbaru
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ingin Menjelajahi Lebih Banyak?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Temukan ribuan event menarik lainnya dari berbagai kategori. Mulai dari musik, olahraga, hingga seminar edukasi.
            </p>
            <Link
              href="/events"
              className="inline-block px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-gray-100 transition shadow-lg transform hover:scale-105"
            >
              Jelajahi Semua Event 🚀
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
