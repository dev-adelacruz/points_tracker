import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { emceeService } from '../../services/emceeService';
import { sessionService } from '../../services/sessionService';
import { reportService } from '../../services/reportService';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import type { Session } from '../../interfaces/session';
import type { TeamTotalsRow } from '../../interfaces/teamTotals';
import TrendBadge from '../../components/TrendBadge';
import type { DateRange } from '../../interfaces/dateRange';
import { buildDateRange } from '../../components/PeriodSelector';
import PeriodSelector from '../../components/PeriodSelector';
import { Modal, FormError, SubmitButton, CloseButton } from '../../components/AdminShared';
import { Users, UserCheck, Mic, Calendar, AlertTriangle, Coins } from 'lucide-react';

// ---------------------------------------------------------------------------
// Previous period helper
// ---------------------------------------------------------------------------
const getPreviousPeriod = (startDate: string, endDate: string) => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
};

// ---------------------------------------------------------------------------
// Period label helper
// ---------------------------------------------------------------------------
const periodLabel = (range: DateRange): string => {
  switch (range.preset) {
    case 'today': return 'Today';
    case 'this_week': return 'This Week';
    case 'this_month': return 'This Month';
    case 'last_month': return 'Last Month';
    case 'custom': return `${range.startDate} – ${range.endDate}`;
    default: return 'This Month';
  }
};

// ---------------------------------------------------------------------------
// Greeting helpers
// ---------------------------------------------------------------------------
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = (): string =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------
const DashboardPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const userName = useSelector((state: RootState) => state.user.user?.name ?? 'there');

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [activeHostCount, setActiveHostCount] = useState(0);
  const [emceeCount, setEmceeCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teamTotals, setTeamTotals] = useState<TeamTotalsRow[]>([]);
  const [prevTeamTotals, setPrevTeamTotals] = useState<TeamTotalsRow[]>([]);

  // Period selector — default: This Month
  const [dateRange, setDateRange] = useState<DateRange>(() => buildDateRange('this_month'));

  // Trend state
  const [totalCoins, setTotalCoins] = useState(0);
  const [coinDeltaPct, setCoinDeltaPct] = useState<number | null>(null);
  const [sessionDeltaPct, setSessionDeltaPct] = useState<number | null>(null);

  // New Team modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  // New Host modal
  const [showHostModal, setShowHostModal] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [hostTeamId, setHostTeamId] = useState('');
  const [hostFormError, setHostFormError] = useState<string | null>(null);
  const [hostSubmitting, setHostSubmitting] = useState(false);

  // New Session modal
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionSlot, setSessionSlot] = useState<'first' | 'second'>('first');
  const [sessionTeamId, setSessionTeamId] = useState('');
  const [sessionHostIds, setSessionHostIds] = useState<number[]>([]);
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  // New Emcee modal
  const [showEmceeModal, setShowEmceeModal] = useState(false);
  const [emceeName, setEmceeName] = useState('');
  const [emceeEmail, setEmceeEmail] = useState('');
  const [emceePassword, setEmceePassword] = useState('');
  const [emceeFormError, setEmceeFormError] = useState<string | null>(null);
  const [emceeSubmitting, setEmceeSubmitting] = useState(false);

  // Initial load — fetch static data (teams, hosts, emcees) once
  useEffect(() => {
    if (!token) return;

    Promise.all([
      teamService.getTeams(token),
      hostService.getHosts(token),
      emceeService.getEmcees(token),
    ])
      .then(([t, h, e]) => {
        setTeams(t);
        setHosts(h);
        setActiveHostCount(h.filter((host) => host.active).length);
        setEmceeCount(e.length);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Period-driven fetch — re-runs whenever dateRange changes
  useEffect(() => {
    if (!token) return;
    setAnalyticsLoading(true);

    const { prevStart, prevEnd } = getPreviousPeriod(dateRange.startDate, dateRange.endDate);

    Promise.all([
      sessionService.getSessions(token, {
        date_from: dateRange.startDate,
        date_to: dateRange.endDate,
      }),
      reportService.getTeamTotals(token, dateRange.startDate, dateRange.endDate),
      reportService.getPeriodComparison(token, {
        period_a_start: dateRange.startDate,
        period_a_end: dateRange.endDate,
        period_b_start: prevStart,
        period_b_end: prevEnd,
        scope: 'all_hosts',
      }),
      sessionService.getSessions(token, { date_from: prevStart, date_to: prevEnd }),
      reportService.getTeamTotals(token, prevStart, prevEnd),
    ])
      .then(([s, totals, comparison, prevSessions, prevTotals]) => {
        setSessions(s.sessions);
        setTeamTotals(totals);
        setPrevTeamTotals(prevTotals);

        const coinsA = comparison.reduce((sum: number, row: any) => sum + row.period_a_total, 0);
        const coinsB = comparison.reduce((sum: number, row: any) => sum + row.period_b_total, 0);
        setTotalCoins(coinsA);
        const coinDelta = coinsB > 0 ? ((coinsA - coinsB) / coinsB) * 100 : coinsA > 0 ? 100 : 0;
        setCoinDeltaPct(coinDelta);

        const sessionsA = s.sessions.length;
        const sessionsB = prevSessions.sessions.length;
        const sessDelta = sessionsB > 0 ? ((sessionsA - sessionsB) / sessionsB) * 100 : sessionsA > 0 ? 100 : 0;
        setSessionDeltaPct(sessDelta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setAnalyticsLoading(false));
  }, [token, dateRange]);

  // Modal openers/closers
  const closeTeamModal = useCallback(() => setShowTeamModal(false), []);
  const closeHostModal = useCallback(() => setShowHostModal(false), []);
  const closeSessionModal = useCallback(() => setShowSessionModal(false), []);
  const closeEmceeModal = useCallback(() => setShowEmceeModal(false), []);

  const openTeamModal = () => {
    setTeamName(''); setTeamDesc(''); setTeamFormError(null);
    setShowTeamModal(true);
  };

  const openHostModal = () => {
    setHostName(''); setHostEmail(''); setHostPassword(''); setHostTeamId(''); setHostFormError(null);
    setShowHostModal(true);
  };

  const openSessionModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setSessionDate(today);
    setSessionSlot('first');
    setSessionTeamId('');
    setSessionHostIds([]);
    setSessionFormError(null);
    setShowSessionModal(true);
  };

  const openEmceeModal = () => {
    setEmceeName(''); setEmceeEmail(''); setEmceePassword(''); setEmceeFormError(null);
    setShowEmceeModal(true);
  };

  // Form handlers
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTeamSubmitting(true); setTeamFormError(null);
    try {
      const created = await teamService.createTeam(token, { name: teamName, description: teamDesc || undefined });
      setTeams((prev) => [...prev, created]);
      closeTeamModal();
    } catch (err: any) { setTeamFormError(err.message); }
    finally { setTeamSubmitting(false); }
  };

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setHostSubmitting(true); setHostFormError(null);
    try {
      const created = await hostService.createHost(token, {
        name: hostName,
        email: hostEmail,
        password: hostPassword,
        ...(hostTeamId ? { team_id: Number(hostTeamId) } : {}),
      });
      setHosts((prev) => [...prev, created]);
      setActiveHostCount((prev) => prev + 1);
      closeHostModal();
    } catch (err: any) { setHostFormError(err.message); }
    finally { setHostSubmitting(false); }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSessionSubmitting(true); setSessionFormError(null);
    try {
      const created = await sessionService.createSession(token, {
        date: sessionDate,
        session_slot: sessionSlot,
        team_id: Number(sessionTeamId),
        host_ids: sessionHostIds,
      });
      setSessions((prev) => [created, ...prev]);
      closeSessionModal();
    } catch (err: any) { setSessionFormError(err.message); }
    finally { setSessionSubmitting(false); }
  };

  const handleCreateEmcee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setEmceeSubmitting(true); setEmceeFormError(null);
    try {
      await emceeService.createEmcee(token, {
        name: emceeName,
        email: emceeEmail,
        password: emceePassword,
      });
      setEmceeCount((prev) => prev + 1);
      closeEmceeModal();
    } catch (err: any) { setEmceeFormError(err.message); }
    finally { setEmceeSubmitting(false); }
  };

  const toggleSessionHost = (hostId: number) => {
    setSessionHostIds((prev) =>
      prev.includes(hostId) ? prev.filter((id) => id !== hostId) : [...prev, hostId]
    );
  };


  // Derived data
  const activeTeams = teams.filter((t) => t.active);
  const teamsWithoutEmcee = activeTeams.filter((t) => t.emcee_id === null);
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const topTeams = teamTotals.slice(0, 5);
  const label = periodLabel(dateRange);

  const hostsForSelectedTeam = sessionTeamId
    ? hosts.filter((h) => h.active && h.team_id === Number(sessionTeamId))
    : [];

  const statCards = [
    { label: 'Active Teams', value: activeTeams.length, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', trend: null },
    { label: 'Active Hosts', value: activeHostCount, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50', trend: null },
    { label: 'Active Emcees', value: emceeCount, icon: Mic, color: 'text-violet-600', bg: 'bg-violet-50', trend: null },
    { label: `Sessions · ${label}`, value: sessions.length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', trend: sessionDeltaPct },
    { label: `Total Coins · ${label}`, value: totalCoins.toLocaleString(), icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: coinDeltaPct },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <>
      {/* Greeting Header */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5 shadow-sm">
        <p className="text-lg font-bold text-white">{getGreeting()}, {userName}</p>
        <p className="text-sm text-teal-100 mt-0.5">{formatDate()}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(({ label: cardLabel, value, icon: Icon, color, bg, trend }) => (
          <div key={cardLabel} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 font-medium leading-tight">{cardLabel}</p>
                {trend !== null && (
                  <div className="mt-1.5">
                    <TrendBadge deltaPct={trend} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Period Selector */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Period</p>
          {analyticsLoading && (
            <svg className="w-3.5 h-3.5 animate-spin text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
        </div>
        <PeriodSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
        <button
          onClick={openTeamModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
        >
          + New Team
        </button>
        <button
          onClick={openHostModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          + New Host
        </button>
        <button
          onClick={openSessionModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          + New Session
        </button>
        <button
          onClick={openEmceeModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          + New Emcee
        </button>
      </div>

      {/* Attention Needed */}
      {teamsWithoutEmcee.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">Attention Needed</p>
          </div>
          <ul className="space-y-1.5">
            {teamsWithoutEmcee.map((team) => (
              <li key={team.id} className="flex items-center gap-2 text-xs text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span><span className="font-semibold">{team.name}</span> has no emcee assigned</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Teams + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Top Teams</h2>
            <p className="text-xs text-slate-400 mt-0.5">By total coins · {label}</p>
          </div>
          <div className="p-4">
            {analyticsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : topTeams.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No session data for this period.</p>
            ) : (
              <ul className="space-y-3">
                {topTeams.map((row, index) => {
                  const maxCoins = topTeams[0].total_coins || 1;
                  const pct = Math.round((row.total_coins / maxCoins) * 100);
                  const prev = prevTeamTotals.find((p) => p.team_id === row.team_id);
                  const deltaPct = prev && prev.total_coins > 0
                    ? ((row.total_coins - prev.total_coins) / prev.total_coins) * 100
                    : null;
                  return (
                    <li key={row.team_id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4 shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{row.team_name}</p>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <TrendBadge deltaPct={deltaPct} />
                            <p className="text-xs font-bold text-teal-600">{row.total_coins.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          avg {row.avg_coins_per_host.toLocaleString()} coins/host · {row.host_count} host{row.host_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Recent Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest · {label}</p>
          </div>
          <div className="p-4">
            {analyticsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No sessions in this period.</p>
            ) : (
              <ul className="space-y-2">
                {recentSessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.team_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {s.session_slot === 'first' ? 'Slot 1' : 'Slot 2'}
                        {' · '}
                        {s.host_names.length} host{s.host_names.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-bold ${s.coin_total > 0 ? 'text-teal-600' : 'text-amber-500'}`}>
                        {s.coin_total.toLocaleString()}
                      </span>
                      {s.coin_total > 0 ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600">Logged</span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Pending</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* New Team Modal */}
      <Modal open={showTeamModal} onClose={closeTeamModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Team</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a new team to the roster.</p>
          </div>
          <CloseButton onClick={closeTeamModal} />
        </div>
        <form onSubmit={handleCreateTeam}>
          <div className="px-6 py-5 space-y-3">
            {teamFormError && <FormError message={teamFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team Name</label>
              <input
                type="text"
                placeholder="e.g. Alpha Squad"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="Short description"
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeTeamModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={teamSubmitting} label="Create Team" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>

      {/* New Host Modal */}
      <Modal open={showHostModal} onClose={closeHostModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Host</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a new host to the system.</p>
          </div>
          <CloseButton onClick={closeHostModal} />
        </div>
        <form onSubmit={handleCreateHost}>
          <div className="px-6 py-5 space-y-3">
            {hostFormError && <FormError message={hostFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="host@example.com"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Temporary password"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team <span className="text-slate-400 font-normal">(optional)</span></label>
              <select
                value={hostTeamId}
                onChange={(e) => setHostTeamId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">No team</option>
                {activeTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeHostModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={hostSubmitting} label="Create Host" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>

      {/* New Session Modal */}
      <Modal open={showSessionModal} onClose={closeSessionModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">Schedule a new session.</p>
          </div>
          <CloseButton onClick={closeSessionModal} />
        </div>
        <form onSubmit={handleCreateSession}>
          <div className="px-6 py-5 space-y-3">
            {sessionFormError && <FormError message={sessionFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Session Slot</label>
              <select
                value={sessionSlot}
                onChange={(e) => setSessionSlot(e.target.value as 'first' | 'second')}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="first">Slot 1</option>
                <option value="second">Slot 2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team</label>
              <select
                value={sessionTeamId}
                onChange={(e) => { setSessionTeamId(e.target.value); setSessionHostIds([]); }}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">Select a team</option>
                {activeTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {sessionTeamId && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Hosts <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                {hostsForSelectedTeam.length === 0 ? (
                  <p className="text-xs text-slate-400">No active hosts in this team.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {hostsForSelectedTeam.map((h) => (
                      <label key={h.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={sessionHostIds.includes(h.id)}
                          onChange={() => toggleSessionHost(h.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-xs text-slate-700 group-hover:text-slate-900">{h.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeSessionModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={sessionSubmitting} label="Create Session" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>

      {/* New Emcee Modal */}
      <Modal open={showEmceeModal} onClose={closeEmceeModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Emcee</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a new emcee to the system.</p>
          </div>
          <CloseButton onClick={closeEmceeModal} />
        </div>
        <form onSubmit={handleCreateEmcee}>
          <div className="px-6 py-5 space-y-3">
            {emceeFormError && <FormError message={emceeFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={emceeName}
                onChange={(e) => setEmceeName(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="emcee@example.com"
                value={emceeEmail}
                onChange={(e) => setEmceeEmail(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Temporary password"
                value={emceePassword}
                onChange={(e) => setEmceePassword(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeEmceeModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={emceeSubmitting} label="Create Emcee" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default DashboardPage;
