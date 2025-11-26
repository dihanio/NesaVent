import axios from 'axios';

// Determine which API URL to use
const getApiUrl = () => {
  // If accessing from mobile/other device, use network IP
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL_NETWORK || 'http://10.2.41.139:5000/api';
  }
  // If accessing from localhost, use localhost
  return process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk handle response error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Hanya redirect jika status 401 dan kita TIDAK sedang di halaman login
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Token expired atau tidak valid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
