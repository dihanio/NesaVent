// types/admin.ts
export interface DashboardStats {
  totalUsers: number;
  totalUsersGrowth: number; // persentase kenaikan
  totalEvents: number;
  activeEvents: number;
  pendingEvents: number;
  totalRevenue: number;
  totalRevenueGrowth: number;
  totalTicketsSold: number;
  totalTicketsSoldGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  tickets: number;
}

export interface PendingEvent {
  _id: string;
  nama: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  kategori: string;
  gambar?: string;
  penyelenggara: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'aktif' | 'selesai';
  createdBy: {
    _id: string;
    nama: string;
    email: string;
    organisasi?: string;
  };
  tiketTersedia: Array<{
    nama: string;
    harga: number;
    stok: number;
    stokTersisa: number;
  }>;
  createdAt: string;
  alasanDitolak?: string;
}

export interface RecentOrder {
  _id: string;
  orderId: string;
  namaPembeli: string;
  emailPembeli: string;
  event: {
    nama: string;
  };
  finalTotal: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  createdAt: string;
}

export interface UserData {
  _id: string;
  nama: string;
  email: string;
  nomorTelepon: string;
  role: 'admin' | 'mitra' | 'user';
  organisasi?: string;
  isVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  totalEvents?: number;
  createdAt: string;
  lastLogin?: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number; // untuk percentage type
  usageLimit: number;
  usageLimitPerUser: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreatePromoCodeData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit: number;
  usageLimitPerUser: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface UpdatePromoCodeData extends Partial<CreatePromoCodeData> {
  _id: string;
}

export interface AdminFilters {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  totalPages?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}