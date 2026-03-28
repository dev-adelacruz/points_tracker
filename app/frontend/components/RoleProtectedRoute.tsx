import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import type { UserRole } from '../interfaces/state/userState';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const user = useSelector((state: RootState) => state.user.user);
  const isSignedIn = useSelector((state: RootState) => state.user.isSignedIn);

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.role || !allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
