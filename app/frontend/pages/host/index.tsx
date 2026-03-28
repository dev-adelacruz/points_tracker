import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
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
            {currentUser?.email?.slice(0, 2).toUpperCase() ?? 'H'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{currentUser?.email}</p>
            <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Company Leaderboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">All hosts in the company.</p>
        </div>

        <div className="p-6">
          {isLoading && <p className="text-sm text-slate-400">Loading leaderboard...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && hosts.length === 0 && (
            <p className="text-sm text-slate-400">No hosts found.</p>
          )}
          {!isLoading && !error && hosts.length > 0 && (
            <ul className="space-y-2">
              {hosts.map((host, index) => {
                const isMe = host.id === currentUser?.id;
                return (
                  <li
                    key={host.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${isMe ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-teal-50 hover:border-teal-100'}`}
                  >
                    <span className="w-5 text-xs font-bold text-slate-400 shrink-0">{index + 1}</span>
                    <span className="flex-1 truncate">{host.email}</span>
                    {isMe && <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">You</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HostDashboard;
