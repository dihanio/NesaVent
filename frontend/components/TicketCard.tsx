import Link from 'next/link';

interface Ticket {
  _id: string;
  kodeTicket: string;
  qrCode: string;
  namaPemilik: string;
  status: 'aktif' | 'terpakai' | 'expired';
  event: {
    _id: string;
    nama: string;
    slug?: string;
    tanggal: string;
    waktu: string;
    lokasi: string;
  };
  createdAt: string;
}

interface TicketCardProps {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'bg-green-100 text-green-800';
      case 'terpakai':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'Aktif';
      case 'terpakai':
        return 'Sudah Digunakan';
      case 'expired':
        return 'Kadaluarsa';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-1 text-gray-800">
              {ticket.event.nama}
            </h3>
            <p className="text-sm text-gray-600">{ticket.kodeTicket}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              ticket.status
            )}`}
          >
            {getStatusText(ticket.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>{ticket.namaPemilik}</span>
          </div>

          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
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
            <span>{formatTanggal(ticket.event.tanggal)}</span>
          </div>

          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
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
            <span>{ticket.event.waktu}</span>
          </div>

          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
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
            <span>{ticket.event.lokasi}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-4 bg-gray-50 rounded-lg mb-4">
          <img
            src={ticket.qrCode}
            alt="QR Code"
            className="w-40 h-40"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Cetak Tiket
          </button>
          <Link
            href={`/dashboard/tickets/${ticket._id}`}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition text-center"
          >
            Detail Tiket
          </Link>
        </div>
      </div>
    </div>
  );
}
