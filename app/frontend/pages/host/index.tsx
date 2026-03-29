import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import Leaderboard from '../../components/Leaderboard';
import { hostService } from '../../services/hostService';
import type { Host } from '../../interfaces/host';

const HostDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    hostService
      .getHosts(token)
      .then(setHosts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900">My Profile</h2>
        <p className="text-xs text-slate-400 mt-0.5">Your account details.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {currentUser?.name?.slice(0, 2).toUpperCase() ?? 'H'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{currentUser?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-8">
          <p className="text-sm text-slate-400">Loading leaderboard...</p>
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-white border border-red-100 shadow-sm px-6 py-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
      {!isLoading && !error && (
        <Leaderboard hosts={hosts} currentUserId={currentUser?.id} />
      )}
    </DashboardLayout>
  );
};

export default HostDashboard;
