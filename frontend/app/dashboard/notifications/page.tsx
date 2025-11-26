'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { formatTanggal } from '@/lib/formatters';
import DashboardLayout from '@/components/DashboardLayout';

interface Notification {
  _id: string;
  type: 'event_approved' | 'event_rejected' | 'new_order' | 'withdrawal_processed' | 'withdrawal_rejected' | 'event_reminder';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  relatedEvent?: {
    _id: string;
    nama: string;
  };
  relatedOrder?: {
    _id: string;
    totalHarga: number;
  };
  relatedWithdrawal?: {
    _id: string;
    jumlah: number;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [page, filterUnread]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterUnread && { unreadOnly: 'true' })
      });

      const response = await api.get(`/notifications?${params}`);
      
      if (page === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setUnreadCount(response.data.unreadCount);
      setHasMore(response.data.notifications.length === 20);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Hapus notifikasi ini?')) return;

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearReadNotifications = async () => {
    if (!confirm('Hapus semua notifikasi yang sudah dibaca?')) return;

    try {
      await api.delete('/notifications/clear-read');
      setNotifications(prev => prev.filter(notif => !notif.isRead));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to related page
    if (notification.relatedEvent) {
      router.push(`/dashboard/events`);
    } else if (notification.relatedOrder) {
      router.push(`/dashboard/orders`);
    } else if (notification.relatedWithdrawal) {
      router.push(`/dashboard/withdrawals`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_approved':
        return '🎉';
      case 'event_rejected':
        return '❌';
      case 'new_order':
        return '🎫';
      case 'withdrawal_processed':
        return '💰';
      case 'withdrawal_rejected':
        return '❌';
      case 'event_reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event_approved':
      case 'withdrawal_processed':
        return 'bg-green-50 border-green-200';
      case 'event_rejected':
      case 'withdrawal_rejected':
        return 'bg-red-50 border-red-200';
      case 'new_order':
        return 'bg-blue-50 border-blue-200';
      case 'event_reminder':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Notifikasi</h1>
          <p className="text-sm md:text-base text-gray-600">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilterUnread(!filterUnread);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                filterUnread
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterUnread ? 'Semua' : 'Belum Dibaca'}
            </button>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold text-sm"
              >
                Tandai Semua Dibaca
              </button>
            )}
            <button
              onClick={clearReadNotifications}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-sm"
            >
              Hapus Semua yang Dibaca
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {loading && page === 1 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Notifikasi</h3>
            <p className="text-gray-600">
              {filterUnread ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi untuk Anda'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  notification.isRead ? 'bg-white' : getNotificationColor(notification.type)
                } ${!notification.isRead ? 'border-2' : ''} hover:shadow-md`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl border border-gray-200 shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-bold text-base md:text-lg ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                      )}
                    </div>
                    
                    <p className={`text-sm md:text-base mb-2 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
                      <span>{formatTanggal(notification.createdAt)}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="text-red-600 hover:text-red-800 font-semibold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && !loading && (
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="w-full py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold"
              >
                Muat Lebih Banyak
              </button>
            )}

            {loading && page > 1 && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
