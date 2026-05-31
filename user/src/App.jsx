import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// ── Public Pages ──────────────────────────────────────────
import Landing          from './pages/Landing';
import AuthLogin        from './pages/auth/Login';
import AuthRegister     from './pages/auth/Register';
import ProviderLogin    from './pages/auth/ProviderLogin';
import ProviderRegister from './pages/auth/ProviderRegister';

// ── Legacy / existing auth (phone-OTP flow) ───────────────
import LegacyLogin      from './pages/Login';
import CompleteProfile  from './pages/CompleteProfile';

// ── Protected (customer) pages ────────────────────────────
import Home             from './pages/Home';
import Search           from './pages/Search';
import ProviderProfile  from './pages/ProviderProfile';
import Booking          from './pages/Booking';
import Bookings         from './pages/Bookings';
import BookingTracking  from './pages/BookingTracking';
import WriteReview      from './pages/WriteReview';
import Profile          from './pages/Profile';

// ── Route guards ──────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force profile completion if name is missing (phone-OTP new users)
  if (user && !user.name && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

// Redirect already-logged-in users away from auth pages
const GuestRoute = ({ children, redirectTo = '/home' }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to={redirectTo} replace /> : children;
};

function App() {
  return (
    <Routes>
      {/* ── Landing page (public) ───────────────────────── */}
      <Route path="/" element={<Landing />} />

      {/* ── Customer auth ───────────────────────────────── */}
      <Route
        path="/login"
        element={
          <GuestRoute redirectTo="/home">
            <AuthLogin />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute redirectTo="/home">
            <AuthRegister />
          </GuestRoute>
        }
      />

      {/* ── Provider auth ───────────────────────────────── */}
      <Route
        path="/provider/login"
        element={
          <GuestRoute redirectTo="/provider/dashboard">
            <ProviderLogin />
          </GuestRoute>
        }
      />
      <Route
        path="/provider/register"
        element={
          <GuestRoute redirectTo="/provider/dashboard">
            <ProviderRegister />
          </GuestRoute>
        }
      />

      {/* ── Legacy phone-OTP login (kept for backwards compat) ── */}
      <Route path="/otp-login" element={<LegacyLogin />} />

      {/* ── Profile completion (post-OTP new users) ─────── */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* ── Protected customer pages ─────────────────────── */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/:id"
        element={
          <ProtectedRoute>
            <ProviderProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:providerId"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <BookingTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review/:bookingId"
        element={
          <ProtectedRoute>
            <WriteReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
