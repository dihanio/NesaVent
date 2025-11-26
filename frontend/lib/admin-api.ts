// lib/admin-api.ts
import api from './api';
import {
  DashboardStats,
  RevenueData,
  PendingEvent,
  RecentOrder,
  UserData,
  PromoCode,
  CreatePromoCodeData,
  UpdatePromoCodeData,
  AdminFilters,
  ApiResponse
} from '@/types/admin';

// Dashboard Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data dashboard');
  }
};

// Revenue Chart Data
export const getRevenueChart = async (days: number = 30): Promise<RevenueData[]> => {
  try {
    const response = await api.get(`/admin/analytics/revenue?days=${days}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data revenue');
  }
};

// Event Management
export const getPendingEvents = async (): Promise<PendingEvent[]> => {
  try {
    const response = await api.get('/admin/events?status=pending&limit=10');
    return response.data.events || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data event pending');
  }
};

export const getAllEvents = async (filters: AdminFilters = {}): Promise<ApiResponse<PendingEvent[]>> => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/admin/events?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data event');
  }
};

export const approveEvent = async (eventId: string): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/admin/events/${eventId}/status`, {
      status: 'approved'
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menyetujui event');
  }
};

export const rejectEvent = async (eventId: string, reason: string): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/admin/events/${eventId}/status`, {
      status: 'rejected',
      rejectionReason: reason
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menolak event');
  }
};

export const getApprovedEvents = async (): Promise<PendingEvent[]> => {
  try {
    const response = await api.get('/admin/events?status=approved');
    return response.data.events || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data event disetujui');
  }
};

export const getRejectedEvents = async (): Promise<PendingEvent[]> => {
  try {
    const response = await api.get('/admin/events?status=rejected');
    return response.data.events || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data event ditolak');
  }
};

export const deleteEvent = async (eventId: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/admin/events/${eventId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus event');
  }
};

// User Management
export const getUsers = async (filters: AdminFilters = {}): Promise<ApiResponse<UserData[]>> => {
  try {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data pengguna');
  }
};

export const updateUserRole = async (userId: string, role: 'admin' | 'mitra' | 'user'): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengupdate role pengguna');
  }
};

export const suspendUser = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/admin/users/${userId}/suspend`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menangguhkan pengguna');
  }
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus pengguna');
  }
};

export const resetUserPassword = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await api.post(`/admin/users/${userId}/reset-password`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mereset password pengguna');
  }
};

// Promo Code Management
export const getPromoCodes = async (): Promise<PromoCode[]> => {
  try {
    const response = await api.get('/admin/promo-codes');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data promo code');
  }
};

export const createPromoCode = async (data: CreatePromoCodeData): Promise<PromoCode> => {
  try {
    const response = await api.post('/admin/promo-codes', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal membuat promo code');
  }
};

export const updatePromoCode = async (id: string, data: UpdatePromoCodeData): Promise<PromoCode> => {
  try {
    const response = await api.put(`/admin/promo-codes/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengupdate promo code');
  }
};

export const deletePromoCode = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/admin/promo-codes/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus promo code');
  }
};

export const togglePromoCodeStatus = async (id: string, isActive: boolean): Promise<PromoCode> => {
  try {
    const response = await api.put(`/admin/promo-codes/${id}/status`, { isActive });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengubah status promo code');
  }
};

// Recent Orders for Dashboard
export const getRecentOrders = async (limit: number = 10): Promise<RecentOrder[]> => {
  try {
    const response = await api.get(`/admin/orders/recent?limit=${limit}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data pesanan terbaru');
  }
};