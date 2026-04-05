import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { hostService } from '../services/hostService';
import type { QuotaStats } from '../interfaces/quotaStats';
import { getHostStatus, STATUS_BAR } from '../utils/hostStatus';
import StatusBadge from './StatusBadge';

const QuotaProgressBar: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    hostService
      .getQuotaStats(token)
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-5">
        <p className="text-sm text-slate-400">Loading quota...</p>
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  const status = getHostStatus({
    on_track: stats.on_track,
    total_coins: stats.total_coins,
    paced_monthly_coins: stats.paced_monthly_coins,
    monthly_coin_quota: stats.monthly_coin_quota,
  });
  const barClass = status ? STATUS_BAR[status] : 'bg-slate-300';
  const clampedProgress = Math.min(stats.quota_progress, 100);
  const absDelta = Math.abs(stats.pacing_delta).toLocaleString();
  const pacingText = stats.pacing_delta >= 0
    ? `You are ${absDelta} coins ahead of pace`
    : `You are ${absDelta} coins behind pace`;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Monthly Quota</h2>
          <p className="text-xs text-slate-400 mt-0.5">Resets at the start of each calendar month.</p>
        </div>
        {status && <StatusBadge status={status} />}
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-extrabold text-slate-900">
          {stats.total_coins.toLocaleString()}
        </span>
        <span className="text-xs text-slate-400">
          of {stats.monthly_coin_quota.toLocaleString()} coins
        </span>
      </div>

      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">{pacingText}</p>
        <p className="text-xs font-semibold text-slate-600">{stats.quota_progress}%</p>
      </div>
    </div>
  );
};

export default QuotaProgressBar;
