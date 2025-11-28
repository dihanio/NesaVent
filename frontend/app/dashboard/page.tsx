'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import AdminDashboardHome from '@/components/dashboard/AdminDashboardHome';
import MitraDashboardHome from '@/components/dashboard/MitraDashboardHome';
import UserDashboardHome from '@/components/dashboard/UserDashboardHome';

interface TicketType {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  stokTersisa: number;
  deskripsi: string;
}

interface Ticket {
  _id: string;
  nama: string;
  harga: number;
  event: {
    _id: string;
    nama: string;
    tanggal: string;
    lokasi: string;
    gambar?: string;
  };
  order: {
    _id: string;
    createdAt: string;
    status: string;
  };
  qrCode?: string;
  isUsed: boolean;
}

interface Order {
  _id: string;
  totalHarga: number;
  status: string;
  createdAt: string;
  items: {
    ticket: Ticket;
    quantity: number;
  }[];
}

interface Event {
  _id: string;
  nama: string;
  slug: string;
  tanggal: string;
  lokasi: string;
  kategori: string;
  harga?: number;
  stok?: number;
  tiketTersedia?: TicketType[];
  totalStok?: number;
  totalStokTersisa?: number;
  status: 'draft' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan' | 'ditolak';
  gambar?: string;
  createdAt: string;
  alasanDitolak?: string;
  isVerified?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan' | 'ditolak'>('all');
  const [sortBy, setSortBy] = useState<'tanggal' | 'nama' | 'terbaru'>('terbaru');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingEvents: 0,
    activeMitra: 0,
    newUsersThisMonth: 0,
    rejectedEvents: 0,
  });
  const [user, setUser] = useState<any>(null);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchDashboardData(currentUser?.role);
  }, []);

  const fetchDashboardData = async (role?: string) => {
    if (role === 'admin') {
      // Admin dashboard - show global stats
      try {
        const response = await api.get('/admin/dashboard');
        // For admin, we show platform-wide statistics
        setStats({
          totalUsers: response.data.totalUsers || 0,
          totalEvents: response.data.totalEvents || 0,
          activeEvents: response.data.activeEvents || 0,
          totalTicketsSold: response.data.totalTicketsSold || 0,
          totalRevenue: response.data.totalRevenue || 0,
          totalOrders: response.data.totalOrders || 0,
          pendingOrders: response.data.pendingOrders || 0,
          pendingEvents: response.data.pendingEvents || 0,
          activeMitra: response.data.activeMitra || 0,
          newUsersThisMonth: response.data.newUsersThisMonth || 0,
          rejectedEvents: response.data.rejectedEvents || 0,
        });
      } catch (error) {
        console.error('Error fetching admin dashboard:', error);
      }
    } else if (role === 'mitra') {
      // Mitra dashboard - show partner's events and stats
      try {
        const response = await api.get('/admin/dashboard');
        setStats({
          totalEvents: response.data.totalEvents || 0,
          activeEvents: response.data.activeEvents || 0,
          totalTicketsSold: response.data.totalTicketsSold || 0,
          totalRevenue: response.data.totalRevenue || 0,
          totalUsers: 0,
          totalOrders: response.data.totalOrders || 0,
          pendingOrders: 0,
          pendingEvents: response.data.pendingEvents || 0,
          activeMitra: 0,
          newUsersThisMonth: 0,
          rejectedEvents: 0,
        });
      } catch (error) {
        console.error('Error fetching mitra dashboard:', error);
      }
      fetchEvents();
    } else if (role === 'user') {
      // User dashboard - show user's tickets and orders
      await fetchUserDashboardData();
    }
    setLoading(false);
  };

  const fetchUserDashboardData = async () => {
    try {
      // Fetch user's tickets
      const ticketsResponse = await api.get('/tickets/my-tickets');
      setUserTickets(ticketsResponse.data);

      // Fetch user's orders
      const ordersResponse = await api.get('/orders/my-orders');
      setUserOrders(ordersResponse.data);

      // Get upcoming events from user's tickets
      const upcomingTickets = ticketsResponse.data.filter((ticket: Ticket) =>
        new Date(ticket.event.tanggal) > new Date()
      );
      const upcomingEventIds = [...new Set(upcomingTickets.map((ticket: Ticket) => ticket.event._id))];

      // Fetch full event details for upcoming events
      const uniqueUpcomingTickets = upcomingEventIds.map(eventId =>
        upcomingTickets.find((ticket: Ticket) => ticket.event._id === eventId)
      ).filter(Boolean);
      const upcomingEventsPromises = uniqueUpcomingTickets.map(ticket => api.get(`/events/${ticket.event.slug}`));
      const upcomingEventsResponses = await Promise.all(upcomingEventsPromises);
      const upcomingEventsData = upcomingEventsResponses.map(response => response.data);
      setUpcomingEvents(upcomingEventsData);

      // Calculate user stats
      const totalTickets = ticketsResponse.data.length;
      const usedTickets = ticketsResponse.data.filter((ticket: Ticket) => ticket.isUsed).length;
      const totalSpent = ordersResponse.data.reduce((sum: number, order: Order) => sum + order.totalHarga, 0);
      const upcomingTicketsCount = upcomingTickets.length;

      setStats({
        totalEvents: upcomingTicketsCount,
        activeEvents: totalTickets - usedTickets,
        totalTicketsSold: totalTickets,
        totalRevenue: totalSpent,
        totalUsers: 0,
        totalOrders: ordersResponse.data.length,
        pendingOrders: 0,
        pendingEvents: 0,
        activeMitra: 0,
        newUsersThisMonth: 0,
        rejectedEvents: 0,
      });
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events/my-events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSort = (column: 'nama' | 'tanggal') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render specific dashboard based on role
  if (user?.role === 'admin') {
    return (
      <DashboardLayout>
        <AdminDashboardHome stats={stats} />
      </DashboardLayout>
    );
  }

  if (user?.role === 'mitra') {
    return (
      <DashboardLayout>
        <MitraDashboardHome
          stats={stats}
          events={events}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
      </DashboardLayout>
    );
  }

  // Default to User Dashboard
  return (
    <DashboardLayout>
      <UserDashboardHome
        stats={stats}
        userTickets={userTickets}
        userOrders={userOrders}
        upcomingEvents={upcomingEvents}
      />
    </DashboardLayout>
  );
}
