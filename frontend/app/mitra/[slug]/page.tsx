'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMitraPublicProfile, getEventsByMitra } from "@/lib/mitra-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EventCard from "@/components/EventCard";
import { Separator } from "@/components/ui/separator";

interface Mitra {
  _id: string;
  nama: string;
  organisasi?: string;
  avatar?: string;
  slug: string;
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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-gray-100 pt-24 pb-12">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <header className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <Avatar className="h-24 w-24 border-4 border-blue-100 shadow-lg">
              <AvatarImage src={mitra.avatar} alt={mitra.nama} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {mitra.nama.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                {mitra.nama}
              </h1>
              {mitra.organisasi && (
                <p className="mt-2 text-lg text-gray-600">
                  {mitra.organisasi}
                </p>
              )}
            </div>
          </div>
        </header>

        <main>
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
              Event oleh {mitra.nama}
            </h2>
          </div>

          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mx-auto mb-4">
                📅
              </div>
              <p className="text-gray-600 text-lg">
                Organizer ini belum memiliki event.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
