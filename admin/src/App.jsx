import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { connectSocket, disconnectSocket } from './lib/socket';

// Layouts — eagerly imported (small, always needed)
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

// Pages — lazy loaded (split bundles, faster initial load)
const Login              = lazy(() => import('./pages/Login'));
const Dashboard          = lazy(() => import('./pages/dashboard/Dashboard'));
const UserList           = lazy(() => import('./pages/users/UserList'));
const ProviderList       = lazy(() => import('./pages/providers/ProviderList'));
const BookingList        = lazy(() => import('./pages/bookings/BookingList'));
const PaymentList        = lazy(() => import('./pages/payments/PaymentList'));
const CategoryList       = lazy(() => import('./pages/categories/CategoryList'));
const NotificationManager= lazy(() => import('./pages/notifications/NotificationManager'));
const AuditLogs          = lazy(() => import('./pages/audit/AuditLogs'));
const SettingsPage       = lazy(() => import('./pages/settings/SettingsPage'));

// Placeholder pages for routes not yet fully built
const UserDetail          = () => <div className="p-8 text-slate-600">User Detail — Coming Soon</div>;
const ProviderDetail      = () => <div className="p-8 text-slate-600">Provider Detail — Coming Soon</div>;
const PendingVerifications= () => <div className="p-8 text-slate-600">Pending Verifications — Coming Soon</div>;
const BookingDetail       = () => <div className="p-8 text-slate-600">Booking Detail — Coming Soon</div>;
const AnalyticsPage       = () => <div className="p-8 text-slate-600">Analytics — Coming Soon</div>;
const NotFound            = () => (
  <div className="p-12 text-center">
    <h1 className="text-5xl font-bold text-slate-300">404</h1>
    <p className="mt-3 text-slate-500 font-medium">Page not found.</p>
    <a href="/dashboard" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">
      Go to Dashboard
    </a>
  </div>
);

// Spinners
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[300px]">
    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedLayout — wraps all admin routes, redirects to /login if not authed
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedLayout = () => {
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    }
    return () => disconnectSocket();
  }, [isAuthenticated, accessToken]);

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
// NOTE: No PersistGate here — it lives in main.jsx to avoid double-wrapping
// which causes the app to hang and render a blank white page.
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login" element={<Login />} />

        {/* ── Protected ── */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/"              element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/users"         element={<UserList />} />
          <Route path="/users/:id"     element={<UserDetail />} />
          <Route path="/providers"           element={<ProviderList />} />
          <Route path="/providers/pending"   element={<PendingVerifications />} />
          <Route path="/providers/:id"       element={<ProviderDetail />} />
          <Route path="/bookings"            element={<BookingList />} />
          <Route path="/bookings/:id"        element={<BookingDetail />} />
          <Route path="/payments"      element={<PaymentList />} />
          <Route path="/categories"    element={<CategoryList />} />
          <Route path="/notifications" element={<NotificationManager />} />
          <Route path="/analytics"     element={<AnalyticsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/audit"         element={<AuditLogs />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
