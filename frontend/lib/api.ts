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

// Interceptor to handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 if we're in the browser
    if (isBrowser && error.response?.status === 401 && window.location.pathname !== '/login') {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
