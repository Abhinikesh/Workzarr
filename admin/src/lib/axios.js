import axios from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';

/**
 * Axios instance for the Admin portal.
 *
 * Because Vite proxies /api → http://localhost:5000, we use a
 * relative baseURL (/api/v1) so the proxy handles the actual routing.
 * This avoids CORS issues and means no hard-coded port in the code.
 */
export const axiosInstance = axios.create({
  baseURL: '/api/v1',   // Proxied by Vite → http://localhost:5000/api/v1
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
        const { data } = await axios.post(
          '/api/v1/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        store.dispatch(
          setCredentials({
            admin: store.getState().auth.admin,
            accessToken: newToken,
          })
        );
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
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
