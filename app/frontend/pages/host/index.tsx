import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { updateUser } from '../../state/user/userSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Leaderboard from '../../components/Leaderboard';
import QuotaProgressBar from '../../components/QuotaProgressBar';
import MyPerformanceSection from '../../components/MyPerformanceSection';
import { hostService } from '../../services/hostService';
import type { Host } from '../../interfaces/host';

type LeaderboardView = 'all' | 'my_team';

const HostDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.user.token);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>('all');

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Profile edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCurrentPassword, setFormCurrentPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const openEditModal = () => {
    setFormName(currentUser?.name ?? '');
    setFormEmail(currentUser?.email ?? '');
    setFormPassword('');
    setFormCurrentPassword('');
    setFormError(null);
    setShowEditModal(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setIsEditModalVisible(true)));
  };

  const closeEditModal = useCallback(() => {
    setIsEditModalVisible(false);
    setTimeout(() => setShowEditModal(false), 220);
  }, []);

  useEffect(() => {
    if (!showEditModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEditModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showEditModal, closeEditModal]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setFormError(null);
    try {
      const updated = await hostService.updateProfile(token, {
        name: formName,
        email: formEmail,
        ...(formPassword ? { password: formPassword, current_password: formCurrentPassword } : {}),
        ...(formEmail !== currentUser?.email && !formPassword ? { current_password: formCurrentPassword } : {}),
      });
      dispatch(updateUser({ name: updated.name, email: updated.email }));
      closeEditModal();
    } catch (err: any) {
      setFormError(err.message);
      setIsSaving(false);
    }
  };

  const emailChanging = formEmail !== (currentUser?.email ?? '');
  const passwordChanging = formPassword.length > 0;
  const needsCurrentPassword = emailChanging || passwordChanging;

  const currentHostTeamId = hosts.find((h) => h.id === currentUser?.id)?.team_id ?? null;
  const hasTeam = currentHostTeamId !== null;

  const leaderboardHosts =
    leaderboardView === 'my_team' && hasTeam
      ? hosts.filter((h) => h.team_id === currentHostTeamId)
      : hosts;

  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your account details.</p>
          </div>
          <button
            onClick={openEditModal}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-150"
          >
            Edit
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {currentUser?.name?.slice(0, 2).toUpperCase() ?? 'H'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{currentUser?.name}</p>
            <p className="text-xs text-slate-400">{currentUser?.email}</p>
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
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {leaderboardView === 'my_team' ? 'Team Leaderboard' : 'Company Leaderboard'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {leaderboardView === 'my_team'
                  ? 'Hosts on your team.'
                  : 'All hosts in the company.'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">All-time ranking</p>
            </div>

            {!hasTeam && (
              <p className="text-xs text-slate-400 italic">
                You haven't been assigned to a team yet. Contact your administrator.
              </p>
            )}

            {hasTeam && (
              <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-1 shrink-0">
                <button
                  onClick={() => setLeaderboardView('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    leaderboardView === 'all'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  All Hosts
                </button>
                <button
                  onClick={() => setLeaderboardView('my_team')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    leaderboardView === 'my_team'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  My Team
                </button>
              </div>
            )}
          </div>

          <Leaderboard bare hosts={leaderboardHosts} currentUserId={currentUser?.id} />
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 transition-all duration-200 ${isEditModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isEditModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeEditModal}
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 max-h-[90vh] overflow-y-auto ${isEditModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 sm:translate-y-3'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update your name, email, or password.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <p className="text-xs text-red-600">{formError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  />
                </div>

                {needsCurrentPassword && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Current Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      value={formCurrentPassword}
                      onChange={(e) => setFormCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Required when changing email or password.</p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HostDashboard;
