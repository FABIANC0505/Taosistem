import axios, { AxiosInstance } from 'axios';

const envApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const hasInvalidPlaceholder =
  !envApiUrl ||
  envApiUrl.includes('tu-backend-production') ||
  envApiUrl.includes('backend:8000');

const API_BASE_URL = hasInvalidPlaceholder ? 'http://localhost:8000' : envApiUrl;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Solo redirigir si no estamos ya en /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
