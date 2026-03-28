import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { leaderboardService } from '../../services/leaderboardService';
import { teamService } from '../../services/teamService';
import type { LeaderboardEntry, LeaderboardMeta } from '../../interfaces/leaderboard';
import type { Team } from '../../interfaces/team';

const SS_PRESET = 'lb_preset';
const SS_TEAM = 'lb_team_id';

const formatCoins = (n: number) => n.toLocaleString();

const RANK_CONFIG = [
  { bg: 'bg-amber-400', text: 'text-amber-900', ring: 'ring-amber-300', rowBg: 'bg-gradient-to-r from-amber-50 to-yellow-50', border: 'border-amber-200', label: '🥇' },
  { bg: 'bg-slate-400', text: 'text-slate-900', ring: 'ring-slate-300', rowBg: 'bg-gradient-to-r from-slate-50 to-slate-100', border: 'border-slate-200', label: '🥈' },
  { bg: 'bg-orange-400', text: 'text-orange-900', ring: 'ring-orange-300', rowBg: 'bg-gradient-to-r from-orange-50 to-amber-50', border: 'border-orange-200', label: '🥉' },
];

const LeaderboardPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const userRole = useSelector((state: RootState) => state.user.user?.role);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(() => {
    const v = sessionStorage.getItem(SS_TEAM);
    return v ? Number(v) : null;
  });
  const [preset, setPreset] = useState<'today' | 'week' | 'month' | 'all'>(() => {
    return (sessionStorage.getItem(SS_PRESET) as 'today' | 'week' | 'month' | 'all') || 'month';
  });
  const [page, setPage] = useState(1);

  const canFilterByTeam = userRole === 'admin' || userRole === 'emcee';

  useEffect(() => {
    if (!token || !canFilterByTeam) return;
    teamService.getTeams(token).then(setTeams).catch(() => {});
  }, [token, canFilterByTeam]);

  const presetRange = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const todayStr = fmt(d);
    if (preset === 'today') return { date_from: todayStr, date_to: todayStr };
    if (preset === 'week') {
      const w = new Date(d); w.setDate(d.getDate() - d.getDay());
      return { date_from: fmt(w), date_to: todayStr };
    }
    if (preset === 'month') {
      const m = new Date(d.getFullYear(), d.getMonth(), 1);
      return { date_from: fmt(m), date_to: todayStr };
    }
    return {};
  }, [preset]);

  const load = useCallback((p: number) => {
    if (!token) return;
    setIsLoading(true);
    setAnimated(false);
    setError(null);
    leaderboardService.getLeaderboard(token, {
      ...presetRange,
      ...(selectedTeamId ? { team_id: selectedTeamId } : {}),
      page: p,
      per_page: 50,
    })
      .then((result) => {
        setEntries(result.data);
        setMeta(result.meta);
        requestAnimationFrame(() => setAnimated(true));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [token, presetRange, selectedTeamId]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [presetRange, selectedTeamId]);

  useEffect(() => {
    load(page);
  }, [page]);

  const handlePreset = (p: typeof preset) => {
    sessionStorage.setItem(SS_PRESET, p);
    setPreset(p);
  };

  const handleTeamChange = (teamId: number | null) => {
    if (teamId === null) sessionStorage.removeItem(SS_TEAM);
    else sessionStorage.setItem(SS_TEAM, String(teamId));
    setSelectedTeamId(teamId);
  };

  const activeTeams = canFilterByTeam ? teams.filter((t) => t.active) : [];

  return (
    <DashboardLayout title="Leaderboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-base font-bold text-white tracking-tight">Company Leaderboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">All active hosts ranked by total coins earned.</p>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                preset === p
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}

          {canFilterByTeam && activeTeams.length > 0 && (
            <>
              <span className="w-px h-4 bg-slate-200 mx-1" />
              <select
                value={selectedTeamId ?? ''}
                onChange={(e) => handleTeamChange(e.target.value === '' ? null : Number(e.target.value))}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow bg-white"
              >
                <option value="">All Teams</option>
                {activeTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </>
          )}

          {meta && (
            <span className="ml-auto text-xs font-medium text-slate-400">{meta.total_count} host{meta.total_count !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center gap-2 py-4">
              <svg className="w-4 h-4 animate-spin text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm text-slate-400">Loading rankings...</p>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && entries.length === 0 && (
            <p className="text-sm text-slate-400">No data for this period{selectedTeamId ? ' and team' : ''}.</p>
          )}
          {!isLoading && !error && entries.length > 0 && (
            <>
              <ul className="space-y-2">
                {entries.map((entry, idx) => {
                  const isTop3 = entry.rank <= 3;
                  const cfg = isTop3 ? RANK_CONFIG[entry.rank - 1] : null;
                  const belowQuota = entry.monthly_coin_quota > 0 && entry.quota_progress < 50;
                  return (
                    <li
                      key={entry.user_id}
                      className={`animate-lb-row flex items-center gap-3 rounded-xl border px-4 transition-all ${
                        isTop3
                          ? `${cfg!.rowBg} ${cfg!.border} ${entry.is_current_user ? 'ring-2 ring-teal-300' : ''} py-4`
                          : entry.is_current_user
                          ? 'border-teal-300 bg-teal-50 ring-1 ring-teal-200 py-3'
                          : 'border-slate-100 bg-slate-50 py-3'
                      }`}
                      style={{ animationDelay: animated ? `${Math.min(idx * 40, 800)}ms` : '0ms' }}
                    >
                      {/* Rank badge */}
                      {isTop3 ? (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shrink-0 ring-2 ${cfg!.bg} ${cfg!.ring} shadow-sm`}>
                          {cfg!.label}
                        </div>
                      ) : (
                        <span className="w-9 text-center text-xs font-bold text-slate-400 shrink-0">
                          #{entry.rank}
                        </span>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-bold truncate ${isTop3 ? 'text-slate-900' : entry.is_current_user ? 'text-teal-800' : 'text-slate-800'}`}>
                            {entry.email}
                          </p>
                          {entry.is_current_user && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 shrink-0">you</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {entry.team_name ?? 'No team'} · {entry.sessions_count} session{entry.sessions_count !== 1 ? 's' : ''}
                          {entry.monthly_coin_quota > 0 && (
                            <> · <span className={belowQuota ? 'text-red-500 font-semibold' : 'text-slate-500'}>{entry.quota_progress}% quota</span></>
                          )}
                        </p>
                      </div>

                      {/* Coin total */}
                      <span className={`font-black shrink-0 tabular-nums ${
                        isTop3 ? 'text-base text-slate-900' : entry.is_current_user ? 'text-sm text-teal-700' : 'text-sm text-slate-700'
                      }`}>
                        {formatCoins(entry.total_coins)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-400">Page {meta.current_page} of {meta.total_pages}</span>
                  <button
                    disabled={page >= meta.total_pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;
