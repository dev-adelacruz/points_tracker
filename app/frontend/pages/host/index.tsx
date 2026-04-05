import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import Leaderboard from '../../components/Leaderboard';
import QuotaProgressBar from '../../components/QuotaProgressBar';
import MyPerformanceSection from '../../components/MyPerformanceSection';
import { hostService } from '../../services/hostService';
import type { Host } from '../../interfaces/host';

const HostDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    if (!token) return;

    hostService
      .getHosts(token)
      .then(setHosts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));

    hostService
      .getNotificationSettings(token)
      .then((s) => setEmailNotificationsEnabled(s.email_notifications_enabled))
      .catch(() => {});
  }, [token]);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!token) return;
    setSavingNotifications(true);
    try {
      const updated = await hostService.updateNotificationSettings(token, enabled);
      setEmailNotificationsEnabled(updated.email_notifications_enabled);
    } finally {
      setSavingNotifications(false);
    }
  };

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

        <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-700">Weekly email digest</p>
            <p className="text-xs text-slate-400 mt-0.5">Receive a Monday summary of your coins, rank, and quota progress.</p>
          </div>
          <button
            type="button"
            disabled={savingNotifications}
            onClick={() => handleToggleNotifications(!emailNotificationsEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 ${emailNotificationsEnabled ? 'bg-teal-600' : 'bg-slate-200'}`}
            role="switch"
            aria-checked={emailNotificationsEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <QuotaProgressBar />

      <MyPerformanceSection />

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
