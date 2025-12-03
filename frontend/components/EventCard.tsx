import Link from 'next/link';
import { formatTanggal, formatWaktu, formatHarga } from '@/lib/formatters';

interface TicketType {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  stokTersisa: number;
  deskripsi?: string;
  mulaiJual?: string | Date;
  akhirJual?: string | Date;
}

interface Event {
  _id: string;
  nama: string;
  slug: string;
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

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  // Check if ticket is currently on sale based on mulaiJual and akhirJual
  const isTicketOnSale = (ticket: TicketType) => {
    const now = new Date();
    const mulaiJual = ticket.mulaiJual ? new Date(ticket.mulaiJual) : null;
    const akhirJual = ticket.akhirJual ? new Date(ticket.akhirJual) : null;
    
    // Check if sale period has started
    if (mulaiJual && now < mulaiJual) return false;
    
    // Check if sale period has ended
    if (akhirJual && now > akhirJual) return false;
    
    return true;
  };

  // Get minimum price from ticket types (only from available and on-sale tickets)
  const getMinPrice = () => {
    if (event.tiketTersedia && event.tiketTersedia.length > 0) {
      // Filter only tickets with available stock AND currently on sale
      const availableTickets = event.tiketTersedia.filter(t => 
        t.stokTersisa > 0 && isTicketOnSale(t)
      );
      
      if (availableTickets.length > 0) {
        const prices = availableTickets.map(t => t.harga || 0);
        return Math.min(...prices);
      }
      
      // If no tickets available, return 0
      return 0;
    }
    return event.harga || 0;
  };

  // Get total available stock (only from on-sale tickets)
  const getTotalStok = () => {
    if (event.tiketTersedia && event.tiketTersedia.length > 0) {
      // Only count stock from tickets that are currently on sale
      return event.tiketTersedia
        .filter(t => isTicketOnSale(t))
        .reduce((total, t) => total + t.stokTersisa, 0);
    }
    return event.totalStokTersisa || event.stok || 0;
  };

  const minPrice = getMinPrice();
  const totalStok = getTotalStok();

  return (
    <Link href={`/events/${event.slug}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 shrink-0">
          <img
            src={event.gambar}
            alt={event.nama}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/default-event.jpg';
            }}
          />
          <span className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {event.kategori}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col grow">
          <h3 className="font-bold text-xl mb-2 text-gray-800 line-clamp-2 h-14">
            {event.nama}
          </h3>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 shrink-0 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatTanggal(event.tanggal)}</span>
            </div>

            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 shrink-0 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatWaktu(event.waktu)}</span>
            </div>

            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 shrink-0 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-1">{event.lokasi}</span>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Harga mulai dari</p>
                <p className="text-lg font-bold text-blue-600">
                  {minPrice > 0 ? formatHarga(minPrice) : 'Gratis'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Sisa tiket</p>
                <p className={`text-sm font-semibold ${totalStok > 0 ? 'text-gray-800' : 'text-red-600'}`}>
                  {totalStok > 0 ? totalStok : 'Habis'}
                </p>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm hover:shadow-md">
              Lihat Detail
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
