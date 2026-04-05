import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { sessionService } from '../../services/sessionService';
import { coinEntryService } from '../../services/coinEntryService';
import { teamHostStatService } from '../../services/teamHostStatService';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import type { Session } from '../../interfaces/session';
import type { TeamHostStat } from '../../interfaces/teamHostStat';
import { Users, UserCheck, Calendar, Zap } from 'lucide-react';
import StatCard from '../../components/StatCard';
import Leaderboard from '../../components/Leaderboard';

type FilterMode = 'today' | 'month' | 'range';

const EmceeDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const currentUser = useSelector((state: RootState) => state.user.user);

  const [teams, setTeams] = useState<Team[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const startOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // --- Session modal ---
  const [showModal, setShowModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formSlot, setFormSlot] = useState<'first' | 'second'>('first');
  const [formTeamId, setFormTeamId] = useState('');
  const [formHostIds, setFormHostIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Coin modal ---
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [isCoinModalVisible, setIsCoinModalVisible] = useState(false);
  const [coinSession, setCoinSession] = useState<Session | null>(null);
  const [coinValues, setCoinValues] = useState<Record<number, string>>({});
  const [coinError, setCoinError] = useState<string | null>(null);
  const [isCoinSubmitting, setIsCoinSubmitting] = useState(false);

  // --- Leaderboard ---
  const [allTeamStats, setAllTeamStats] = useState<Record<number, TeamHostStat[]>>({});
  const [leaderboardTeamId, setLeaderboardTeamId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [rangeFrom, setRangeFrom] = useState(startOfMonth);
  const [rangeTo, setRangeTo] = useState(today);
  const [leaderboardStats, setLeaderboardStats] = useState<TeamHostStat[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      teamService.getTeams(token),
      hostService.getHosts(token, { active: true }),
      sessionService.getSessions(token),
    ])
      .then(async ([t, h, s]) => {
        setTeams(t);
        setHosts(h);
        setSessions(s.sessions);

        const activeT = t.filter((team) => team.active);
        if (activeT.length > 0) {
          const statsResults = await Promise.all(
            activeT.map((team) =>
              teamHostStatService
                .getTeamHostStats(token, team.id, startOfMonth, today)
                .catch(() => [] as TeamHostStat[]),
            ),
          );
          const statsMap: Record<number, TeamHostStat[]> = {};
          activeT.forEach((team, i) => {
            statsMap[team.id] = statsResults[i];
          });
          setAllTeamStats(statsMap);
          setLeaderboardTeamId(activeT[0].id);
          setLeaderboardStats(statsResults[0] ?? []);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const fetchLeaderboard = useCallback(
    async (teamId: number, dateFrom: string, dateTo: string) => {
      if (!token) return;
      setIsLeaderboardLoading(true);
      try {
        const stats = await teamHostStatService.getTeamHostStats(token, teamId, dateFrom, dateTo);
        setLeaderboardStats(stats);
      } catch {
        // silently fail — stale data stays visible
      } finally {
        setIsLeaderboardLoading(false);
      }
    },
    [token],
  );

  const handleFilterMode = (mode: FilterMode) => {
    setFilterMode(mode);
    if (!leaderboardTeamId) return;
    if (mode === 'today') {
      fetchLeaderboard(leaderboardTeamId, today, today);
    } else if (mode === 'month') {
      fetchLeaderboard(leaderboardTeamId, startOfMonth, today);
    }
    // 'range' waits for explicit Apply
  };

  const handleTeamChange = (teamId: number) => {
    setLeaderboardTeamId(teamId);
    const dateFrom =
      filterMode === 'today' ? today : filterMode === 'month' ? startOfMonth : rangeFrom;
    const dateTo = filterMode === 'today' ? today : filterMode === 'month' ? today : rangeTo;
    fetchLeaderboard(teamId, dateFrom, dateTo);
  };

  const handleApplyRange = () => {
    if (!leaderboardTeamId) return;
    fetchLeaderboard(leaderboardTeamId, rangeFrom, rangeTo);
  };

  // --- Session modal handlers ---
  const openModal = () => {
    setFormDate('');
    setFormSlot('first');
    setFormTeamId('');
    setFormHostIds([]);
    setFormError(null);
    setShowModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsModalVisible(true));
    });
  };

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => setShowModal(false), 220);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showModal, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formTeamId) return;
    setIsSubmitting(true);
    setFormError(null);
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
    setFormHostIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  // --- Coin modal handlers ---
  const openCoinModal = useCallback((session: Session) => {
    const initial: Record<number, string> = {};
    session.host_ids.forEach((id) => {
      initial[id] = '0';
    });
    setCoinSession(session);
    setCoinValues(initial);
    setCoinError(null);
    setShowCoinModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsCoinModalVisible(true));
    });
  }, []);

  const closeCoinModal = useCallback(() => {
    setIsCoinModalVisible(false);
    setTimeout(() => {
      setShowCoinModal(false);
      setCoinSession(null);
      setCoinValues({});
      setCoinError(null);
    }, 220);
  }, []);

  useEffect(() => {
    if (!showCoinModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCoinModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showCoinModal, closeCoinModal]);

  const handleCoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !coinSession) return;
    setIsCoinSubmitting(true);
    setCoinError(null);
    try {
      const entries = Object.entries(coinValues).map(([uid, coins]) => ({
        user_id: Number(uid),
        coins: Number(coins),
      }));
      await coinEntryService.saveCoinEntries(token, coinSession.id, entries);
      const total = entries.reduce((sum, e) => sum + e.coins, 0);
      setSessions((prev) =>
        prev.map((s) => (s.id === coinSession.id ? { ...s, coin_total: total } : s)),
      );

      // Refresh leaderboard for the currently selected team
      if (leaderboardTeamId) {
        const dateFrom =
          filterMode === 'today' ? today : filterMode === 'month' ? startOfMonth : rangeFrom;
        const dateTo =
          filterMode === 'today' ? today : filterMode === 'month' ? today : rangeTo;
        const updatedStats = await teamHostStatService
          .getTeamHostStats(token, leaderboardTeamId, dateFrom, dateTo)
          .catch(() => null);
        if (updatedStats) setLeaderboardStats(updatedStats);
      }

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
  const totalCoinsThisMonth = Object.values(allTeamStats)
    .flat()
    .reduce((sum, h) => sum + h.total_coins, 0);
  const totalActiveHosts = activeTeams.reduce((sum, t) => sum + t.host_count, 0);

  const statCards = [
    { label: 'Assigned Teams', value: activeTeams.length, icon: Users, accent: 'teal' as const },
    {
      label: 'Sessions This Month',
      value: thisMonthSessions.length,
      icon: Calendar,
      accent: 'blue' as const,
    },
    {
      label: 'Coins Logged This Month',
      value: totalCoinsThisMonth.toLocaleString(),
      icon: Zap,
      accent: 'amber' as const,
    },
    {
      label: 'Active Hosts',
      value: totalActiveHosts,
      icon: UserCheck,
      accent: 'violet' as const,
    },
  ];

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 h-24 animate-pulse"
            />
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
          className="text-xs font-semibold px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 min-h-12 sm:min-h-0"
        >
          + New Session
        </button>
      </div>

      {/* Recent Sessions */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Recent Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 5 sessions across your teams</p>
          </div>
          <button
            onClick={openModal}
            className="text-xs font-semibold px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 min-h-12 sm:min-h-0"
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
                  <li
                    key={session.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {session.team_name}
                        </p>
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
                        {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' · '}
                        {session.session_slot === 'first' ? 'Slot 1' : 'Slot 2'}
                        {session.coin_total > 0 &&
                          ` · ${session.coin_total.toLocaleString()} coins`}
                      </p>
                    </div>
                    {isPending && (
                      <button
                        onClick={() => openCoinModal(session)}
                        className="text-xs font-semibold px-3 py-3 sm:py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all duration-150 shrink-0 min-h-12 sm:min-h-0"
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

      {/* Team Leaderboard — per-member with filter controls */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Team Leaderboard</h2>
              <p className="text-xs text-slate-400 mt-0.5">Host rankings by coins earned</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Team selector — only shown when emcee manages multiple teams */}
              {activeTeams.length > 1 && leaderboardTeamId !== null && (
                <select
                  value={leaderboardTeamId}
                  onChange={(e) => handleTeamChange(Number(e.target.value))}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow min-h-12 sm:min-h-0"
                >
                  {activeTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Period filter toggle */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(['today', 'month', 'range'] as FilterMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleFilterMode(mode)}
                    className={`text-xs px-2.5 py-3 sm:py-1.5 font-medium transition-colors min-h-12 sm:min-h-0 ${
                      filterMode === mode
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode === 'today' ? 'Today' : mode === 'month' ? 'This Month' : 'Range'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date range inputs — revealed when Range is active */}
          {filterMode === 'range' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
              <input
                type="date"
                value={rangeFrom}
                max={rangeTo}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow w-full sm:w-auto min-h-12 sm:min-h-0"
              />
              <span className="text-xs text-slate-400 hidden sm:block">to</span>
              <input
                type="date"
                value={rangeTo}
                min={rangeFrom}
                max={today}
                onChange={(e) => setRangeTo(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow w-full sm:w-auto min-h-12 sm:min-h-0"
              />
              <button
                onClick={handleApplyRange}
                className="text-xs font-semibold px-3 py-3 sm:py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 min-h-12 sm:min-h-0"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        <div className="p-4">
          {isLeaderboardLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : leaderboardStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No data for the selected period.
            </p>
          ) : (
            <Leaderboard
              stats={leaderboardStats}
              currentUserId={currentUser?.id}
              bare
            />
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 transition-all duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeModal}
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 max-h-[90vh] overflow-y-auto ${isModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 sm:translate-y-3'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">New Session</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record a live session for coin entry.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
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
                    onChange={(e) => {
                      setFormTeamId(e.target.value);
                      setFormHostIds([]);
                    }}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select team</option>
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formTeamId &&
                  (() => {
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
                            <p className="px-3 py-2.5 text-sm text-slate-400">
                              No hosts on this team.
                            </p>
                          )}
                          {teamHosts.map((host) => (
                            <label
                              key={host.id}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                formHostIds.includes(host.id) ? 'bg-teal-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formHostIds.includes(host.id)}
                                onChange={() => toggleHost(host.id)}
                                className="rounded accent-teal-600"
                              />
                              <span className="text-sm text-slate-700 truncate flex-1">
                                {host.name}
                              </span>
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
                      <svg
                        className="w-3 h-3 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Creating…
                    </span>
                  ) : (
                    'Create Session'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coin Entry Modal */}
      {showCoinModal && coinSession && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 transition-all duration-200 ${isCoinModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isCoinModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeCoinModal}
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 max-h-[90vh] overflow-y-auto ${isCoinModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 sm:translate-y-3'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Log Coins</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {coinSession.date} —{' '}
                  {coinSession.session_slot === 'first' ? '1st' : '2nd'} Session ·{' '}
                  {coinSession.team_name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCoinModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCoinSubmit}>
              <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
                {coinError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-red-600">{coinError}</p>
                  </div>
                )}
                {coinSession.host_ids.map((hostId, idx) => (
                  <div key={hostId} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 flex-1 truncate">
                      {coinSession.host_names[idx] ?? `Host #${hostId}`}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={coinValues[hostId] ?? '0'}
                      onChange={(e) =>
                        setCoinValues((prev) => ({ ...prev, [hostId]: e.target.value }))
                      }
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
                      <svg
                        className="w-3 h-3 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    'Save Entries'
                  )}
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
