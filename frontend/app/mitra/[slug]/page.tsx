'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMitraPublicProfile, getEventsByMitra } from "@/lib/mitra-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EventCard from "@/components/EventCard";
import { Separator } from "@/components/ui/separator";

interface Mitra {
  _id: string;
  nama: string;
  organisasi?: string;
  deskripsiOrganisasi?: string;
  instagram?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  themeColor?: string;
  slug: string;
  createdAt?: string;
}

export default function MitraPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [mitra, setMitra] = useState<Mitra | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mitraData, eventsData] = await Promise.all([
          getMitraPublicProfile(slug),
          getEventsByMitra(slug).catch(() => []), // Don't fail if events not found
        ]);

        setMitra(mitraData);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error('Error fetching mitra data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="animate-pulse">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="h-24 w-24 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mitra) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Mitra Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Mitra yang Anda cari tidak tersedia.</p>
          <button
            onClick={() => router.push('/mitra')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Kembali ke Daftar Mitra
          </button>
        </div>
      </div>
    );
  }

  const activeEvents = events.filter(e => new Date(e.tanggal) >= new Date());
  const pastEvents = events.filter(e => new Date(e.tanggal) < new Date());

  // Get color classes based on theme
  const themeColor = mitra.themeColor || 'blue';
  const colorClasses = {
    blue: 'from-blue-600 via-indigo-600 to-purple-600',
    indigo: 'from-indigo-600 via-indigo-600 to-purple-600',
    purple: 'from-purple-600 via-purple-600 to-pink-600',
    pink: 'from-pink-600 via-pink-600 to-rose-600',
    red: 'from-red-600 via-red-600 to-orange-600',
    orange: 'from-orange-600 via-orange-600 to-amber-600',
    yellow: 'from-yellow-500 via-yellow-500 to-amber-500',
    green: 'from-green-600 via-green-600 to-emerald-600',
    teal: 'from-teal-600 via-teal-600 to-cyan-600',
    cyan: 'from-cyan-600 via-cyan-600 to-sky-600'
  };
  const gradientClass = colorClasses[themeColor as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 pt-16 pb-12">
      <div className="container mx-auto max-w-6xl">
        {/* Cover Image & Profile */}
        <header className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          {/* Cover Image */}
          <div className={`relative h-48 md:h-72 lg:h-96 bg-linear-to-r ${gradientClass} overflow-hidden`}>
            {mitra.coverImage ? (
              <img
                src={mitra.coverImage}
                alt={`${mitra.nama} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`absolute inset-0 bg-linear-to-r ${gradientClass}`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/30 text-7xl md:text-9xl">🎭</div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="relative px-4 md:px-8 pb-8">
            {/* Avatar & Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-24">
              {/* Avatar */}
              <Avatar className="h-32 w-32 md:h-44 md:w-44 border-6 border-white shadow-2xl ring-4 ring-blue-100 shrink-0">
                <AvatarImage src={mitra.avatar} alt={mitra.nama} />
                <AvatarFallback className="text-5xl md:text-6xl font-bold bg-linear-to-br from-blue-600 to-indigo-600 text-white">
                  {mitra.nama.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name & Org Info */}
              <div className="flex-1 text-center md:text-left md:mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                    {mitra.organisasi || mitra.nama}
                  </h1>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm px-3 py-1 w-fit mx-auto md:mx-0">
                    ✓ Terverifikasi
                  </Badge>
                </div>
                
                {/* Description */}
                {mitra.deskripsiOrganisasi && (
                  <p className="text-sm md:text-base text-gray-600 max-w-3xl leading-relaxed">
                    {mitra.deskripsiOrganisasi}
                  </p>
                )}

                {/* Social Links */}
                {(mitra.instagram || mitra.website) && (
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                    {mitra.instagram && (
                      <a
                        href={`https://instagram.com/${mitra.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        {mitra.instagram}
                      </a>
                    )}
                    {mitra.website && (
                      <a
                        href={mitra.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-gray-100 px-4 md:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-center md:text-left">
              <div>
                <p className="text-2xl font-bold text-blue-600">{events.length}</p>
                <p className="text-sm text-gray-600">Total Event</p>
              </div>
              <Separator orientation="vertical" className="h-12 hidden md:block" />
              <div>
                <p className="text-2xl font-bold text-green-600">{activeEvents.length}</p>
                <p className="text-sm text-gray-600">Event Mendatang</p>
              </div>
              <Separator orientation="vertical" className="h-12 hidden md:block" />
              <div>
                <p className="text-2xl font-bold text-gray-600">{pastEvents.length}</p>
                <p className="text-sm text-gray-600">Event Selesai</p>
              </div>
            </div>
          </div>
        </header>

        {/* Events Section */}
        <main className="px-4">
          {/* Active/Upcoming Events */}
          {activeEvents.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-linear-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Event Mendatang
                  </h2>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                  {activeEvents.length} Event
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-linear-to-b from-gray-400 to-gray-600 rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Event Selesai
                  </h2>
                </div>
                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                  {pastEvents.length} Event
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((event) => (
                  <div key={event._id} className="opacity-75 hover:opacity-100 transition">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No Events */}
          {events.length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 md:p-16 text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
                📅
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Event</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Organizer ini belum membuat event. Pantau terus untuk update terbaru!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
