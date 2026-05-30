import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Pages
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import JobRequests from './pages/JobRequests';
import MyJobs from './pages/MyJobs';
import Earnings from './pages/Earnings';
import Profile from './pages/Profile';

// Protected Route Component for Provider App
const ProtectedRoute = ({ children, requireOnboarded = true }) => {
  const { isAuthenticated, provider } = useSelector((s) => s.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force onboarding if professional details are not configured
  if (requireOnboarded && !provider) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Onboarding multi-step route */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarded={false}>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Provider core gig management workspace routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <JobRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <MyJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/earnings"
        element={
          <ProtectedRoute>
            <Earnings />
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
