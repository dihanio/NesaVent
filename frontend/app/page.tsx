'use client';

import { useEffect, useState } from 'react';
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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero carousel data
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=600&fit=crop',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&h=600&fit=crop',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&h=600&fit=crop',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1920&h=600&fit=crop',
      link: '#'
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

  const kategoriList = [
    'Semua',
    'Musik',
    'Olahraga',
    'Seminar',
    'Workshop',
    'Festival',
    'Lainnya',
  ];

  useEffect(() => {
    fetchEvents();
  }, [kategori, search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (kategori !== 'Semua') params.kategori = kategori;
      if (search) params.search = search;

      const response = await api.get('/events', { params });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Hero Carousel - Rounded with Container */}
      <div className="container mx-auto px-4 pt-6 pb-8">
        <div className="relative w-full aspect-video md:aspect-21/9 overflow-hidden rounded-2xl shadow-2xl">
          {/* Slides */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              onClick={(e) => {
                // On mobile, click to go next slide
                if (window.innerWidth < 768) {
                  e.preventDefault();
                  nextSlide();
                } else {
                  // On desktop, follow the link
                  window.location.href = slide.link;
                }
              }}
              className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-contain bg-gray-900"
              />
            </div>
          ))}

          {/* Navigation Buttons - Desktop Only */}
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition z-10 items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition z-10 items-center justify-center"
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
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari event berdasarkan nama atau lokasi..."
              className="w-full px-6 py-4 pr-14 text-gray-800 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 transition shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Filter Kategori with Modern Design */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Jelajahi Kategori
              </h2>
              <p className="text-gray-600">Temukan event sesuai minat Anda</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {kategoriList.map((kat) => (
              <button
                key={kat}
                onClick={() => setKategori(kat)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md ${
                  kategori === kat
                    ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-blue-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg'
                }`}
              >
                {kat === 'Semua' && '🌐 '}
                {kat === 'Musik' && '🎵 '}
                {kat === 'Olahraga' && '⚽ '}
                {kat === 'Seminar' && '🎓 '}
                {kat === 'Workshop' && '💼 '}
                {kat === 'Festival' && '🎉 '}
                {kat === 'Lainnya' && '📌 '}
                {kat}
              </button>
            ))}
          </div>
        </div>

        {/* Event List with Better Spacing */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Event Tersedia
              </h2>
              <p className="text-gray-600">
                {kategori === 'Semua' ? 'Semua kategori' : `Kategori ${kategori}`} • {events.length} event
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-6 text-gray-600 text-lg font-medium">Memuat event...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Event</h3>
              <p className="text-gray-600 mb-6">
                Tidak ada event yang ditemukan untuk pencarian Anda
              </p>
              <button
                onClick={() => { setSearch(''); setKategori('Semua'); }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
