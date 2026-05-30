import axios from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';

/**
 * Axios instance for the Admin portal.
 *
 * Vite proxies /api → http://localhost:8000, so we use a relative
 * baseURL (/api/v1). This avoids CORS issues and hardcoded ports.
 */
export const axiosInstance = axios.create({
  baseURL: '/api/v1',   // Proxied by Vite → http://localhost:8000/api/v1
  withCredentials: true,
  timeout: 15000,
});

// ── Request interceptor — attach Bearer token ──────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 refresh + errors ────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Service unavailable
    if (error.response?.status === 503) {
      toast.error('System under maintenance. Please try again later.');
      return Promise.reject(error);
    }

    // 401 — try to refresh the access token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        const { data } = await axiosInstance.post('/auth/refresh-token', { refreshToken });
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('adminToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('adminRefreshToken', newRefreshToken);
        }

        store.dispatch(
          setCredentials({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || refreshToken,
            admin: store.getState().auth.admin,
          })
        );

        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        store.dispatch(logout());
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Network error (no response at all)
    if (!error.response) {
      toast.error('Network error. Make sure the backend is running on port 8000.');
    }

    return Promise.reject(error);
  }
);
