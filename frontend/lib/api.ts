import axios from 'axios';

// Helper function to check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Determine which API URL to use
const getApiUrl = () => {
  // If not in browser (server-side) or accessing from localhost, use localhost
  if (!isBrowser || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:5000/api';
  }
  // If accessing from mobile/other device, use network IP
  return process.env.NEXT_PUBLIC_API_URL_NETWORK || 'http://10.2.41.139:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
});

// Interceptor to add token to each request
api.interceptors.request.use(
  (config) => {
    // Only try to get token if we're in the browser
    if (isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to get error message in Indonesian
const getErrorMessage = (error: any): string => {
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message).join(', ');
    }
    
    // Handle specific status codes
    switch (status) {
      case 400:
        return data.message || 'Data yang dikirim tidak valid';
      case 401:
        return data.message || 'Sesi Anda telah berakhir, silakan login kembali';
      case 403:
        return data.message || 'Anda tidak memiliki akses ke fitur ini';
      case 404:
        return data.message || 'Data tidak ditemukan';
      case 409:
        return data.message || 'Data sudah ada dalam sistem';
      case 429:
        return data.message || 'Terlalu banyak permintaan, silakan coba lagi nanti';
      case 500:
        return data.message || 'Terjadi kesalahan server, silakan coba lagi';
      default:
        return data.message || 'Terjadi kesalahan, silakan coba lagi';
    }
  } else if (error.request) {
    return 'Tidak dapat terhubung ke server, periksa koneksi internet Anda';
  } else {
    return error.message || 'Terjadi kesalahan, silakan coba lagi';
  }
};

// Interceptor to handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle errors if we're in the browser
    if (isBrowser) {
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Attach Indonesian error message
      error.message = getErrorMessage(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { getErrorMessage };
