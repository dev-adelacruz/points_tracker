import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { hostService } from '../../services/hostService';
import { hostCoinHistoryService } from '../../services/hostCoinHistoryService';
import { earningsSummaryService } from '../../services/earningsSummaryService';
import { leaderboardRankService } from '../../services/leaderboardRankService';
import type { Host } from '../../interfaces/host';
import type { HostCoinHistoryEntry } from '../../interfaces/hostCoinHistory';
import type { EarningsSummary } from '../../interfaces/earningsSummary';
import type { LeaderboardRank } from '../../interfaces/leaderboardRank';

type Preset = 'today' | 'week' | 'month' | 'all';

const formatCoins = (n: number) => n.toLocaleString();

const today = () => new Date().toISOString().split('T')[0];
const startOf = (unit: 'week' | 'month'): string => {
  const d = new Date();
  if (unit === 'week') {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
  } else {
    d.setDate(1);
  }
  return d.toISOString().split('T')[0];
};

const presetRange = (preset: Preset): { date_from?: string; date_to?: string } => {
  if (preset === 'today') return { date_from: today(), date_to: today() };
  if (preset === 'week') return { date_from: startOf('week'), date_to: today() };
  if (preset === 'month') return { date_from: startOf('month'), date_to: today() };
  return {};
};

const HostDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [hostsError, setHostsError] = useState<string | null>(null);

  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [rank, setRank] = useState<LeaderboardRank | null>(null);

  const [history, setHistory] = useState<HostCoinHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (!token) return;

    hostService
      .getHosts(token)
      .then(setHosts)
      .catch((err: Error) => setHostsError(err.message))
      .finally(() => setHostsLoading(false));

    earningsSummaryService.getEarningsSummary(token).then(setSummary).catch(() => null);
    leaderboardRankService.getLeaderboardRank(token).then(setRank).catch(() => null);
  }, [token]);

  const loadHistory = useCallback((filters: { date_from?: string; date_to?: string }) => {
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError(null);
    hostCoinHistoryService
      .getCoinHistory(token, filters)
      .then(setHistory)
      .catch((err: Error) => setHistoryError(err.message))
      .finally(() => setHistoryLoading(false));
  }, [token]);

  useEffect(() => {
    if (!showCustom) loadHistory(presetRange(preset));
  }, [preset, showCustom, loadHistory]);

  const selectPreset = (p: Preset) => {
    setPreset(p);
    setShowCustom(false);
  };

  const applyCustom = () => {
    loadHistory({ date_from: customFrom || undefined, date_to: customTo || undefined });
  };

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, HostCoinHistoryEntry[]> = {};
    history.forEach((entry) => {
      if (!map[entry.session_date]) map[entry.session_date] = [];
      map[entry.session_date].push(entry);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [history]);

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900">My Profile</h2>
        <p className="text-xs text-slate-400 mt-0.5">Your account details.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {currentUser?.email?.slice(0, 2).toUpperCase() ?? 'H'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.email}</p>
            <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
          </div>
          {rank && (
            <div className="shrink-0 flex flex-col items-center justify-center rounded-xl bg-teal-600 text-white px-3 py-2 min-w-18">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">Rank</p>
              <p className="text-lg font-bold leading-none">#{rank.rank}</p>
              <p className="text-[10px] text-teal-200 mt-0.5">of {rank.total_hosts}</p>
            </div>
          )}
        </div>
      </div>

      {/* Earnings Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { key: 'today' as Preset, label: 'Today', value: summary.today },
            { key: 'week' as Preset, label: 'This Week', value: summary.this_week },
            { key: 'month' as Preset, label: 'This Month', value: summary.this_month, prominent: true },
            { key: 'all' as Preset, label: 'All Time', value: summary.all_time },
          ] as { key: Preset; label: string; value: number; prominent?: boolean }[]).map(({ key, label, value, prominent }) => (
            <button
              key={key}
              onClick={() => selectPreset(key)}
              className={`rounded-2xl border p-4 text-left transition-all duration-150 active:scale-95 ${!showCustom && preset === key ? 'bg-teal-600 border-teal-600 text-white shadow-md' : prominent ? 'bg-teal-50 border-teal-200 text-teal-900 hover:border-teal-400' : 'bg-white border-slate-100 text-slate-800 hover:border-teal-200 shadow-sm'}`}
            >
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${!showCustom && preset === key ? 'text-teal-100' : prominent ? 'text-teal-600' : 'text-slate-400'}`}>{label}</p>
              <p className="text-xl font-bold tabular-nums">{formatCoins(value)}</p>
              <p className={`text-[10px] mt-0.5 ${!showCustom && preset === key ? 'text-teal-200' : 'text-slate-400'}`}>coins</p>
            </button>
          ))}
        </div>
      )}

      {/* Monthly Quota Progress */}
      {summary && summary.monthly_coin_quota > 0 && (() => {
        const pct = Math.min(summary.quota_progress, 100);
        const met = summary.this_month >= summary.monthly_coin_quota;
        const barColor = met ? 'bg-teal-500' : pct >= 66 ? 'bg-teal-500' : pct >= 33 ? 'bg-amber-400' : 'bg-red-400';
        const textColor = met ? 'text-teal-600' : pct >= 66 ? 'text-teal-600' : pct >= 33 ? 'text-amber-600' : 'text-red-500';
        return (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Monthly Quota</h2>
                <p className="text-xs text-slate-400 mt-0.5">Progress toward your {formatCoins(summary.monthly_coin_quota)}-coin target this month.</p>
              </div>
              {met && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">Quota Met 🎉</span>
              )}
            </div>
            <div className="p-6 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Earned</p>
                  <p className={`text-lg font-black tabular-nums ${textColor}`}>{formatCoins(summary.this_month)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Remaining</p>
                  <p className="text-lg font-black tabular-nums text-slate-700">{met ? '—' : formatCoins(summary.coins_remaining)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Days Left</p>
                  <p className="text-lg font-black tabular-nums text-slate-700">{summary.days_remaining_in_month}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">0</span>
                  <span className={`text-sm font-bold ${textColor}`}>{summary.quota_progress}%</span>
                  <span className="text-xs text-slate-500">{formatCoins(summary.monthly_coin_quota)}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor} animate-bar-fill`}
                    style={{ '--bar-width': `${pct}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Coin History */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Coin History</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your earnings by session, grouped by day.</p>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          {presets.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => selectPreset(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${!showCustom && preset === key ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom((v) => !v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showCustom ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50'}`}
          >
            Custom
          </button>
          {showCustom && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={applyCustom}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
              >
                Apply
              </button>
            </>
          )}
        </div>

        <div className="p-6">
          {historyLoading && <p className="text-sm text-slate-400">Loading...</p>}
          {historyError && <p className="text-sm text-red-500">{historyError}</p>}
          {!historyLoading && !historyError && grouped.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-slate-500">No sessions logged yet</p>
              <p className="text-xs text-slate-400 mt-1">Your coin earnings will appear here once a session is recorded.</p>
            </div>
          )}
          {!historyLoading && !historyError && grouped.length > 0 && (
            <div className="space-y-5">
              {grouped.map(([date, entries]) => {
                const dailyTotal = entries.reduce((sum, e) => sum + e.coins, 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{date}</p>
                      <p className="text-xs font-bold text-teal-700">{formatCoins(dailyTotal)} coins</p>
                    </div>
                    <ul className="space-y-1.5">
                      {entries.map((entry) => (
                        <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {entry.session_slot === 'first' ? '1st' : '2nd'} Session
                            </p>
                            <p className="text-xs text-slate-400">{entry.team_name}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-800 shrink-0">{formatCoins(entry.coins)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Company Leaderboard */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Company Leaderboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">All hosts in the company.</p>
        </div>

        <div className="p-6">
          {hostsLoading && <p className="text-sm text-slate-400">Loading leaderboard...</p>}
          {hostsError && <p className="text-sm text-red-500">{hostsError}</p>}
          {!hostsLoading && !hostsError && hosts.length === 0 && (
            <p className="text-sm text-slate-400">No hosts found.</p>
          )}
          {!hostsLoading && !hostsError && hosts.length > 0 && (
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
