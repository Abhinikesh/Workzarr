import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Pages
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import Home from './pages/Home';
import Search from './pages/Search';
import ProviderProfile from './pages/ProviderProfile';
import Booking from './pages/Booking';
import Bookings from './pages/Bookings';
import BookingTracking from './pages/BookingTracking';
import WriteReview from './pages/WriteReview';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Force profile setup if name is missing
  if (user && !user.name && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public / Login Route */}
      <Route path="/" element={<Login />} />

      {/* Protected Setup Route */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* Core User Protected Routes */}
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
