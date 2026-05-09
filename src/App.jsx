// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public customer pages
import ReviewPage from './pages/ReviewPage';

// Auth
import LoginPage from './pages/LoginPage';

// Shared dashboard shell
import DashboardLayout from './components/DashboardLayout';

// Business owner pages
import BusinessReviews  from './pages/business/BusinessReviews';
import BusinessTeam     from './pages/business/BusinessTeam';

// Admin pages
import AdminBusinesses  from './pages/admin/AdminBusinesses';
import AdminEmployees   from './pages/admin/AdminEmployees';
import AdminAnalytics   from './pages/admin/AdminAnalytics';

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/businesses" replace />;
  return <Navigate to={`/dashboard/reviews`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          {/* ── Public customer review pages ── */}
          <Route path="/r/:businessSlug"                element={<ReviewPage />} />
          <Route path="/r/:businessSlug/:employeeSlug"  element={<ReviewPage />} />

          {/* ── Auth ── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Dashboard redirect ── */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* ── Business owner dashboard ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="business">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="reviews" element={<BusinessReviews />} />
            <Route path="team"    element={<BusinessTeam />} />
          </Route>

          {/* ── Admin dashboard ── */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="businesses" element={<AdminBusinesses />} />
            <Route path="employees"  element={<AdminEmployees />} />
            <Route path="analytics"  element={<AdminAnalytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}