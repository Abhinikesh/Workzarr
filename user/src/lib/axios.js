import axios from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';

export const axiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 15000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken || localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

    if (error.response?.status === 503) {
      toast.error('System is under maintenance. Please try again later.');
      return Promise.reject(error);
    }

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
        const refreshToken = store.getState().auth.refreshToken;
        if (!refreshToken) throw new Error('No refresh token available');

        // We use plain axios to avoid infinite loops if it 401s
        const { data } = await axios.post(
          '/api/v1/auth/refresh-token',
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        store.dispatch(
          setCredentials({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || refreshToken,
          })
        );

        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        toast.error('Session expired. Please log in again.');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
