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

const LeaderboardPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const userRole = useSelector((state: RootState) => state.user.user?.role);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    leaderboardService.getLeaderboard(token, {
      ...presetRange,
      ...(selectedTeamId ? { team_id: selectedTeamId } : {}),
      page: p,
      per_page: 50,
    })
      .then((result) => { setEntries(result.data); setMeta(result.meta); })
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
    if (teamId === null) {
      sessionStorage.removeItem(SS_TEAM);
    } else {
      sessionStorage.setItem(SS_TEAM, String(teamId));
    }
    setSelectedTeamId(teamId);
  };

  const activeTeams = canFilterByTeam
    ? (userRole === 'emcee'
        ? teams.filter((t) => t.active)
        : teams.filter((t) => t.active))
    : [];

  return (
    <DashboardLayout title="Leaderboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Company Leaderboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">All active hosts ranked by total coins earned.</p>
        </div>

        <div className="px-6 pt-4 pb-0 flex flex-wrap items-center gap-2">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                preset === p
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
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
            <span className="ml-auto text-xs text-slate-400 self-center">{meta.total_count} host{meta.total_count !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="p-6">
          {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && entries.length === 0 && (
            <p className="text-sm text-slate-400">No data for this period{selectedTeamId ? ' and team' : ''}.</p>
          )}
          {!isLoading && !error && entries.length > 0 && (
            <>
              <ul className="space-y-2">
                {entries.map((entry) => {
                  const belowQuota = entry.monthly_coin_quota > 0 && entry.quota_progress < 50;
                  return (
                    <li
                      key={entry.user_id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        entry.is_current_user
                          ? 'border-teal-300 bg-teal-50 ring-1 ring-teal-200'
                          : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <span className={`w-8 text-center text-xs font-bold shrink-0 ${
                        entry.rank === 1 ? 'text-amber-500' :
                        entry.rank === 2 ? 'text-slate-500' :
                        entry.rank === 3 ? 'text-orange-400' : 'text-slate-400'
                      }`}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${entry.is_current_user ? 'text-teal-800' : 'text-slate-800'}`}>
                            {entry.email}
                            {entry.is_current_user && <span className="ml-1.5 text-[10px] font-bold text-teal-600">(you)</span>}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {entry.team_name ?? 'No team'} · {entry.sessions_count} session{entry.sessions_count !== 1 ? 's' : ''}
                          {entry.monthly_coin_quota > 0 && (
                            <> · <span className={belowQuota ? 'text-red-500 font-medium' : ''}>{entry.quota_progress}% quota</span></>
                          )}
                        </p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${entry.is_current_user ? 'text-teal-700' : 'text-slate-700'}`}>
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
