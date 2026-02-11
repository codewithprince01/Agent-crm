import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for network errors (no response from server)
    if (!error.response) {
      // Dispatch a custom event for global network error handling
      window.dispatchEvent(new CustomEvent('app:network-error', {
        detail: {
          message: 'Unable to connect to server. Please check your internet connection and try again.',
          code: error.code
        }
      }));
    } else if (error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch event or redirect
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
