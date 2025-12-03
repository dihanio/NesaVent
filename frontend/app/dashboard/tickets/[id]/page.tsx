"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Printer, MapPin, Calendar, Clock, User, Ticket as TicketIcon } from 'lucide-react';
import Image from 'next/image';

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
    deskripsi?: string;
    gambar?: string;
    kategori?: string;
  };
  order: {
    _id: string;
    totalHarga: number;
    status: string;
  };
  createdAt: string;
  usedAt?: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicketDetail();
  }, [params.id]);

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${params.id}`);
      setTicket(response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching ticket:', err);
      setError(err.response?.data?.message || 'Gagal memuat detail tiket');
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
        return 'Sudah Terpakai';
      case 'expired':
        return 'Kadaluarsa';
      default:
        return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (ticket?.qrCode) {
      const link = document.createElement('a');
      link.href = ticket.qrCode;
      link.download = `tiket-${ticket.kodeTicket}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !ticket) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card className="p-8 text-center">
            <TicketIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Tiket Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">{error || 'Tiket yang Anda cari tidak ditemukan'}</p>
            <Button onClick={() => router.push('/dashboard/my-tickets')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Tiket
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/my-tickets')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Detail Tiket</h1>
          <p className="text-gray-600 mt-2">Informasi lengkap tiket Anda</p>
        </div>

        {/* Ticket Card - Printable */}
        <Card className="overflow-hidden mb-6">
          {/* Event Banner */}
          {ticket.event.gambar && (
            <div className="relative h-48 w-full bg-gray-200">
              <Image
                src={ticket.event.gambar}
                alt={ticket.event.nama}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-4">
              <Badge className={getStatusColor(ticket.status)}>
                {getStatusText(ticket.status)}
              </Badge>
              {ticket.event.kategori && (
                <Badge variant="outline">{ticket.event.kategori}</Badge>
              )}
            </div>

            {/* Event Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {ticket.event.nama}
            </h2>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-semibold">{formatTanggal(ticket.event.tanggal)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Waktu</p>
                  <p className="font-semibold">{ticket.event.waktu} WIB</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Lokasi</p>
                  <p className="font-semibold">{ticket.event.lokasi}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Nama Pemilik</p>
                  <p className="font-semibold">{ticket.namaPemilik}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TicketIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Kode Tiket</p>
                  <p className="font-semibold font-mono">{ticket.kodeTicket}</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="border-t pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-4">Scan QR Code untuk Check-in</p>
                <div className="relative w-48 h-48 bg-white p-4 border-2 border-gray-200 rounded-lg">
                  <Image
                    src={ticket.qrCode}
                    alt="QR Code"
                    fill
                    sizes="192px"
                    className="object-contain p-2"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center max-w-md">
                  Tunjukkan QR Code ini kepada petugas saat check-in di lokasi event
                </p>
              </div>
            </div>

            {/* Additional Info */}
            {ticket.event.deskripsi && (
              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Tentang Event</h3>
                <p className="text-gray-600 text-sm whitespace-pre-line">
                  {ticket.event.deskripsi}
                </p>
              </div>
            )}

            {/* Order Info */}
            <div className="border-t mt-6 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Informasi Pemesanan</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Tanggal Pembelian</p>
                  <p className="font-semibold">
                    {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Pembayaran</p>
                  <p className="font-semibold">
                    {ticket.order.totalHarga === 0 ? 'GRATIS' : formatRupiah(ticket.order.totalHarga)}
                  </p>
                </div>
                {ticket.usedAt && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Waktu Check-in</p>
                    <p className="font-semibold">
                      {new Date(ticket.usedAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons - Hidden when printing */}
        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <Button
            onClick={handlePrint}
            className="flex-1"
            variant="outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak Tiket
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
          {ticket.event.slug && (
            <Button
              onClick={() => router.push(`/events/${ticket.event.slug}`)}
              className="flex-1"
            >
              Lihat Event
            </Button>
          )}
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .max-w-4xl {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
