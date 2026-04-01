import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { sessionService } from '../../services/sessionService';
import { coinEntryService } from '../../services/coinEntryService';
import { reportService } from '../../services/reportService';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import type { Session } from '../../interfaces/session';
import type { TeamTotalsRow } from '../../interfaces/teamTotals';
import { Users, UserCheck, Calendar, Zap } from 'lucide-react';
import StatCard from '../../components/StatCard';
import ProgressRing from '../../components/ProgressRing';

const EmceeDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const currentUser = useSelector((state: RootState) => state.user.user);

  const [teams, setTeams] = useState<Team[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teamTotals, setTeamTotals] = useState<TeamTotalsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formSlot, setFormSlot] = useState<'first' | 'second'>('first');
  const [formTeamId, setFormTeamId] = useState('');
  const [formHostIds, setFormHostIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCoinModal, setShowCoinModal] = useState(false);
  const [isCoinModalVisible, setIsCoinModalVisible] = useState(false);
  const [coinSession, setCoinSession] = useState<Session | null>(null);
  const [coinValues, setCoinValues] = useState<Record<number, string>>({});
  const [coinError, setCoinError] = useState<string | null>(null);
  const [isCoinSubmitting, setIsCoinSubmitting] = useState(false);

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().split('T')[0];

  useEffect(() => {
    if (!token) return;

    Promise.all([
      teamService.getTeams(token),
      hostService.getHosts(token, { active: true }),
      sessionService.getSessions(token),
      reportService.getTeamTotals(token, startOfMonth, today),
    ])
      .then(([t, h, s, totals]) => {
        setTeams(t);
        setHosts(h);
        setSessions(s);
        setTeamTotals(totals);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  // --- Session modal ---
  const openModal = () => {
    setFormDate(''); setFormSlot('first'); setFormTeamId(''); setFormHostIds([]); setFormError(null);
    setShowModal(true);
    requestAnimationFrame(() => { requestAnimationFrame(() => setIsModalVisible(true)); });
  };

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => { setShowModal(false); }, 220);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showModal, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formTeamId) return;
    setIsSubmitting(true); setFormError(null);
    try {
      const created = await sessionService.createSession(token, {
        date: formDate,
        session_slot: formSlot,
        team_id: Number(formTeamId),
        host_ids: formHostIds,
      });
      setSessions((prev) => [created, ...prev]);
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
      setIsSubmitting(false);
    }
  };

  const toggleHost = (id: number) => {
    setFormHostIds((prev) => prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]);
  };

  // --- Coin modal ---
  const openCoinModal = useCallback((session: Session) => {
    const initial: Record<number, string> = {};
    session.host_ids.forEach((id) => { initial[id] = '0'; });
    setCoinSession(session); setCoinValues(initial); setCoinError(null);
    setShowCoinModal(true);
    requestAnimationFrame(() => { requestAnimationFrame(() => setIsCoinModalVisible(true)); });
  }, []);

  const closeCoinModal = useCallback(() => {
    setIsCoinModalVisible(false);
    setTimeout(() => { setShowCoinModal(false); setCoinSession(null); setCoinValues({}); setCoinError(null); }, 220);
  }, []);

  useEffect(() => {
    if (!showCoinModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCoinModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showCoinModal, closeCoinModal]);

  const handleCoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !coinSession) return;
    setIsCoinSubmitting(true); setCoinError(null);
    try {
      const entries = Object.entries(coinValues).map(([uid, coins]) => ({
        user_id: Number(uid),
        coins: Number(coins),
      }));
      await coinEntryService.saveCoinEntries(token, coinSession.id, entries);
      const total = entries.reduce((sum, e) => sum + e.coins, 0);
      setSessions((prev) =>
        prev.map((s) => s.id === coinSession.id ? { ...s, coin_total: total } : s)
      );
      reportService.getTeamTotals(token, startOfMonth, today).then(setTeamTotals).catch(() => {});
      closeCoinModal();
    } catch (err: any) {
      setCoinError(err.message);
      setIsCoinSubmitting(false);
    }
  };

  // --- Derived stats ---
  const activeTeams = teams.filter((t) => t.active);
  const thisMonthSessions = sessions.filter((s) => {
    const d = new Date(s.date + 'T00:00:00');
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      s.created_by_id === currentUser?.id
    );
  });
  const totalCoinsThisMonth = teamTotals.reduce((sum, r) => sum + r.total_coins, 0);
  const totalActiveHosts = activeTeams.reduce((sum, t) => sum + t.host_count, 0);

  const statCards = [
    { label: 'Assigned Teams', value: activeTeams.length, icon: Users, accent: 'teal' as const },
    { label: 'Sessions This Month', value: thisMonthSessions.length, icon: Calendar, accent: 'blue' as const },
    { label: 'Coins Logged This Month', value: totalCoinsThisMonth.toLocaleString(), icon: Zap, accent: 'amber' as const },
    { label: 'Active Hosts', value: totalActiveHosts, icon: UserCheck, accent: 'violet' as const },
  ];

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const maxCoins = teamTotals.length > 0 ? teamTotals[0].total_coins || 1 : 1;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, accent }) => (
          <StatCard key={label} label={label} value={value} icon={icon} accent={accent} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
        <button
          onClick={openModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
        >
          + New Session
        </button>
      </div>

      {/* Two-column grid: My Teams + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Teams */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">My Teams</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your currently assigned teams</p>
          </div>
          <div className="p-4">
            {activeTeams.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">No teams assigned yet.</p>
                <p className="text-xs text-slate-300 mt-1">Contact your admin to get assigned to a team.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {activeTeams.map((team) => (
                  <li key={team.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      {team.name}
                      <span className="ml-auto text-xs text-slate-400">{team.host_count} host{team.host_count !== 1 ? 's' : ''}</span>
                    </div>
                    {team.members.length > 0 ? (
                      <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-1.5 flex-wrap">
                        {team.members.map((member) => (
                          <span
                            key={member.id}
                            title={member.name}
                            className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 uppercase ring-2 ring-white"
                          >
                            {member.name.charAt(0)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">No hosts assigned.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Sessions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 5 sessions across your teams</p>
            </div>
            <button
              onClick={openModal}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
            >
              + New
            </button>
          </div>
          <div className="p-4">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No sessions recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentSessions.map((session) => {
                  const isPending = session.host_ids.length > 0 && session.coin_total === 0;
                  return (
                    <li key={session.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-800 truncate">{session.team_name}</p>
                          {isPending ? (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                              Pending
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700">
                              Logged
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          {session.session_slot === 'first' ? 'Slot 1' : 'Slot 2'}
                          {session.coin_total > 0 && ` · ${session.coin_total.toLocaleString()} coins`}
                        </p>
                      </div>
                      {isPending && (
                        <button
                          onClick={() => openCoinModal(session)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all duration-150 shrink-0"
                        >
                          Log Coins
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Team Leaderboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your teams ranked by total coins this month</p>
        </div>
        <div className="p-4">
          {teamTotals.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No session data this month.</p>
          ) : (
            <ul className="space-y-3">
              {teamTotals.map((row, index) => (
                <li key={row.team_id} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 w-4 shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{row.team_name}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{row.host_count} host{row.host_count !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-xs font-bold text-teal-600 mt-0.5">{row.total_coins.toLocaleString()} coins</p>
                  </div>
                  <ProgressRing
                    value={row.total_coins}
                    max={maxCoins}
                    size={48}
                    strokeWidth={4}
                    label={row.team_name}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeModal}
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ${isModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">New Session</h2>
                <p className="text-xs text-slate-400 mt-0.5">Record a live session for coin entry.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-red-600">{formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      max={today}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Slot</label>
                    <select
                      value={formSlot}
                      onChange={(e) => setFormSlot(e.target.value as 'first' | 'second')}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    >
                      <option value="first">1st Session</option>
                      <option value="second">2nd Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Team</label>
                  <select
                    value={formTeamId}
                    onChange={(e) => { setFormTeamId(e.target.value); setFormHostIds([]); }}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select team</option>
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {formTeamId && (() => {
                  const teamHosts = hosts.filter((h) => h.team_id === Number(formTeamId));
                  return (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Participating Hosts
                        {formHostIds.length > 0 && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700">
                            {formHostIds.length} selected
                          </span>
                        )}
                      </label>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                        {teamHosts.length === 0 && (
                          <p className="px-3 py-2.5 text-sm text-slate-400">No hosts on this team.</p>
                        )}
                        {teamHosts.map((host) => (
                          <label
                            key={host.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${formHostIds.includes(host.id) ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                          >
                            <input
                              type="checkbox"
                              checked={formHostIds.includes(host.id)}
                              onChange={() => toggleHost(host.id)}
                              className="rounded accent-teal-600"
                            />
                            <span className="text-sm text-slate-700 truncate flex-1">{host.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 min-w-25 text-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </span>
                  ) : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coin Entry Modal */}
      {showCoinModal && coinSession && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isCoinModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isCoinModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeCoinModal}
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ${isCoinModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Log Coins</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {coinSession.date} — {coinSession.session_slot === 'first' ? '1st' : '2nd'} Session · {coinSession.team_name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCoinModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCoinSubmit}>
              <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
                {coinError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-red-600">{coinError}</p>
                  </div>
                )}
                {coinSession.host_ids.map((hostId, idx) => (
                  <div key={hostId} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 flex-1 truncate">{coinSession.host_names[idx] ?? `Host #${hostId}`}</span>
                    <input
                      type="number"
                      min="0"
                      value={coinValues[hostId] ?? '0'}
                      onChange={(e) => setCoinValues((prev) => ({ ...prev, [hostId]: e.target.value }))}
                      className="w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCoinModal}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCoinSubmitting}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 min-w-25 text-center"
                >
                  {isCoinSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving…
                    </span>
                  ) : 'Save Entries'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EmceeDashboard;
