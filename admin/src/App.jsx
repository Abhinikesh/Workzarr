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
        toast.error(`System entering maintenance: ${data.message}`, { duration: 10000 });
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
