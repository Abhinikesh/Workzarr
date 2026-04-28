const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', 'admin');

function writeFile(filePath, content) {
  const fullPath = path.join(basePath, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
}

// 1. main.jsx
writeFile('src/main.jsx', `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store, persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
`);

// 2. App.jsx
writeFile('src/App.jsx', `
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import UserDetailPage from './pages/users/UserDetailPage';
import ProvidersPage from './pages/providers/ProvidersPage';
import ProviderDetailPage from './pages/providers/ProviderDetailPage';
import PendingVerificationsPage from './pages/providers/PendingVerificationsPage';
import BookingsPage from './pages/bookings/BookingsPage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';
import useTheme from './hooks/useTheme';
import { connectSocket, disconnectSocket, socket } from './lib/socket';
import { addAlert } from './store/slices/notificationsSlice';
import { toast } from 'sonner';

const ProtectedLayout = () => {
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
      
      const handleNewAlert = (alert) => {
        dispatch(addAlert(alert));
        toast.info(alert.message || 'New system alert received');
      };
      
      const handleMaintenance = (data) => {
        toast.error(\`System entering maintenance: \${data.message}\`, { duration: 10000 });
      };

      socket.on('admin:new_alert', handleNewAlert);
      socket.on('app:maintenance', handleMaintenance);
      
      return () => {
        socket.off('admin:new_alert', handleNewAlert);
        socket.off('app:maintenance', handleMaintenance);
        disconnectSocket();
      };
    }
  }, [isAuthenticated, accessToken, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App = () => {
  useTheme();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UserDetailPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="providers/pending" element={<PendingVerificationsPage />} />
        <Route path="providers/:providerId" element={<ProviderDetailPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="*" element={<div className="p-8 text-center text-xl font-bold">404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
};

export default App;
`);

// 3. store/index.js
writeFile('src/store/index.js', `
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import notificationsReducer from './slices/notificationsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  notifications: notificationsReducer,
});

const persistConfig = {
  key: 'admin-root',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);
`);

// 4. store/slices/authSlice.js
writeFile('src/store/slices/authSlice.js', `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../lib/axios';

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/admin/login', credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/auth/logout');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const initialState = {
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.admin = action.payload.admin;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.admin = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    updateAdmin: (state, action) => {
      state.admin = { ...state.admin, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.admin = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setCredentials, logout, updateAdmin } = authSlice.actions;
export default authSlice.reducer;
`);

writeFile('src/store/slices/uiSlice.js', `
import { createSlice } from '@reduxjs/toolkit';

export const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false,
    theme: localStorage.getItem('theme') || 'light',
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  },
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
`);

writeFile('src/store/slices/notificationsSlice.js', `
import { createSlice } from '@reduxjs/toolkit';

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    alerts: [],
    unreadCount: 0,
  },
  reducers: {
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.unreadCount = 0;
    },
    setAlerts: (state, action) => {
      state.alerts = action.payload;
    }
  },
});

export const { addAlert, markAllRead, setAlerts } = notificationsSlice.actions;
export default notificationsSlice.reducer;
`);

// 5. lib/axios.js
writeFile('src/lib/axios.js', `
import axios from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
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
      toast.error('System under maintenance. Redirecting...');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(\`\${axiosInstance.defaults.baseURL}/auth/refresh-token\`, {}, { withCredentials: true });
        store.dispatch(setCredentials({ 
          admin: store.getState().auth.admin, 
          accessToken: data.data.accessToken 
        }));
        processQueue(null, data.data.accessToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + data.data.accessToken;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);
`);

// 6. lib/socket.js
writeFile('src/lib/socket.js', `
import { io } from 'socket.io-client';

export let socket;

export const connectSocket = (token) => {
  if (socket) return;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
`);
