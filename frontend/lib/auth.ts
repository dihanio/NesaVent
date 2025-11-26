import api from './api';

interface User {
  _id: string;
  nama: string;
  email: string;
  nomorTelepon?: string;
  role: 'user' | 'mitra' | 'admin';
  organisasi?: string;
}

interface LoginResponse {
  _id: string;
  nama: string;
  email: string;
  nomorTelepon?: string;
  role: 'user' | 'mitra' | 'admin';
  organisasi?: string;
  token: string;
}

export const authService = {
  // Register user baru
  register: async (data: {
    nama: string;
    email: string;
    password: string;
    nomorTelepon?: string;
    role?: 'user' | 'mitra';
    organisasi?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (data: { email: string; password: string }) => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Verify user with code
  verifyCode: async (email: string, code: string) => {
    const response = await api.post<LoginResponse>('/auth/verify-code', { email, code });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Resend verification code
  resendVerificationCode: async (email: string) => {
    const response = await api.post('/auth/resend-code', { email });
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  // Check if user is logged in
  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },

  // Check if user is mitra or admin
  isMitraOrAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user ? (user.role === 'mitra' || user.role === 'admin') : false;
  },

  // Check if user is mitra
  isMitra: (): boolean => {
    const user = authService.getCurrentUser();
    return user ? user.role === 'mitra' : false;
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user ? user.role === 'admin' : false;
  },

  // Get user profile dari API
  getProfile: async () => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },
};
