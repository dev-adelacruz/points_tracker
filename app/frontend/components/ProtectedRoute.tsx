import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isSignedIn = useSelector((state: RootState) => state.user.isSignedIn);
  const isLoading = useSelector((state: RootState) => state.user.isLoading);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
    }
  }, [isLoading]);

  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-10 rounded-2xl bg-slate-200 animate-pulse w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
