import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import AdminDashboard from '../pages/admin';
import EmceeDashboard from '../pages/emcee';
import HostDashboard from '../pages/host';
import LoginPage from '../pages/login';

const RoleRedirect: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);

  if (!user?.role) return <Navigate to="/login" replace />;

  const destinations: Record<string, string> = {
    admin: '/admin',
    emcee: '/emcee',
    host: '/host',
  };

  return <Navigate to={destinations[user.role] ?? '/login'} replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/emcee"
          element={
            <RoleProtectedRoute allowedRoles={['emcee']}>
              <EmceeDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/host"
          element={
            <RoleProtectedRoute allowedRoles={['host']}>
              <HostDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
