import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store';
import { connectSocket, disconnectSocket } from './lib/socket';
import { logout } from './store/slices/authSlice';

// Layouts
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

// Pages (Lazy Loaded)
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const Dashboard          = lazy(() => import('./pages/dashboard/Dashboard'));
const UserList           = lazy(() => import('./pages/users/UserList'));
const ProviderList       = lazy(() => import('./pages/providers/ProviderList'));
const BookingList        = lazy(() => import('./pages/bookings/BookingList'));
const PaymentList        = lazy(() => import('./pages/payments/PaymentList'));
const CategoryList       = lazy(() => import('./pages/categories/CategoryList'));
const NotificationManager= lazy(() => import('./pages/notifications/NotificationManager'));
const AuditLogs          = lazy(() => import('./pages/audit/AuditLogs'));
const SettingsPage       = lazy(() => import('./pages/settings/SettingsPage'));

// Stub pages for routes not yet built
const UserDetail          = () => <div className="p-8">User Detail — Coming Soon</div>;
const ProviderDetail      = () => <div className="p-8">Provider Detail — Coming Soon</div>;
const PendingVerifications= () => <div className="p-8">Pending Verifications — Coming Soon</div>;
const BookingDetail       = () => <div className="p-8">Booking Detail — Coming Soon</div>;
const AnalyticsPage       = () => <div className="p-8">Analytics — Coming Soon</div>;
const NotFound            = () => (
  <div className="p-8 text-center">
    <h1 className="text-4xl font-bold text-slate-700 dark:text-slate-300">404</h1>
    <p className="mt-2 text-slate-500">Page not found.</p>
  </div>
);

// ── Full-screen loading spinner (used while redux-persist rehydrates) ─────────
const FullScreenLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Page-level suspense fallback ──────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[300px]">
    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Protected Layout — guards all admin routes
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedLayout = () => {
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const location = useLocation();

  // Connect / disconnect socket based on auth state
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    }
    return () => disconnectSocket();
  }, [isAuthenticated, accessToken]);

  // Not authenticated → redirect to login, preserving attempted destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const { theme } = useSelector((state) => state.ui);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    // PersistGate blocks rendering until redux-persist has fully rehydrated.
    // This prevents the brief "not authenticated" flash on page refresh.
    <PersistGate loading={<FullScreenLoader />} persistor={persistor}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<FullScreenLoader />}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* Protected */}
        <Route element={<ProtectedLayout />}>
          <Route path="/"              element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/users"         element={<UserList />} />
          <Route path="/users/:userId" element={<UserDetail />} />
          <Route path="/providers"               element={<ProviderList />} />
          <Route path="/providers/:providerId"   element={<ProviderDetail />} />
          <Route path="/providers/pending"       element={<PendingVerifications />} />
          <Route path="/bookings"                element={<BookingList />} />
          <Route path="/bookings/:bookingId"     element={<BookingDetail />} />
          <Route path="/payments"      element={<PaymentList />} />
          <Route path="/categories"    element={<CategoryList />} />
          <Route path="/notifications" element={<NotificationManager />} />
          <Route path="/analytics"     element={<AnalyticsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/audit"         element={<AuditLogs />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PersistGate>
  );
}

export default App;
