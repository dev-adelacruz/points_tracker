import React from 'react';
import type { Host } from '../interfaces/host';
import type { TeamHostStat } from '../interfaces/teamHostStat';

const STAGGER_MS = 60;
const TOP3_STAGGER_MS = 80;

// ── Status derivation ──────────────────────────────────────────────────────
type HostStatus = 'on_track' | 'at_risk' | 'behind';

const getStatus = (stat: TeamHostStat): HostStatus => {
  if (stat.on_track) return 'on_track';
  const deficit = stat.paced_monthly_coins - stat.total_coins;
  return deficit <= stat.monthly_coin_quota * 0.2 ? 'at_risk' : 'behind';
};

const STATUS_BAR: Record<HostStatus, string> = {
  on_track: 'bg-teal-500',
  at_risk:  'bg-amber-400',
  behind:   'bg-red-500',
};

const STATUS_LABEL: Record<HostStatus, string> = {
  on_track: 'On Track',
  at_risk:  'At Risk',
  behind:   'Behind',
};

const STATUS_LABEL_COLOR: Record<HostStatus, string> = {
  on_track: 'text-teal-600',
  at_risk:  'text-amber-500',
  behind:   'text-red-500',
};

// ── Podium medal styles ────────────────────────────────────────────────────
const PODIUM_STYLES = {
  1: {
    card:   'bg-amber-50 border-amber-200',
    medal:  'bg-amber-400 text-white',
    coins:  'text-amber-600',
    label:  '🥇',
    height: 'min-h-[10rem]',
  },
  2: {
    card:   'bg-slate-100 border-slate-300',
    medal:  'bg-slate-400 text-white',
    coins:  'text-slate-600',
    label:  '🥈',
    height: 'min-h-[8.5rem]',
  },
  3: {
    card:   'bg-orange-50 border-orange-200',
    medal:  'bg-orange-400 text-white',
    coins:  'text-orange-600',
    label:  '🥉',
    height: 'min-h-[8.5rem]',
  },
} as const;

// ── Row styles for ranks 4+ ────────────────────────────────────────────────
const ROW_BASE = 'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-150';

// ── Props ──────────────────────────────────────────────────────────────────
interface LeaderboardBaseProps {
  currentUserId?: number;
  title?: string;
  subtitle?: string;
  /** Render without card wrapper — use when the parent already provides a card */
  bare?: boolean;
}

type LeaderboardProps =
  | (LeaderboardBaseProps & { stats: TeamHostStat[]; hosts?: never })
  | (LeaderboardBaseProps & { hosts: Host[]; stats?: never });

// ── Component ─────────────────────────────────────────────────────────────
const Leaderboard: React.FC<LeaderboardProps> = ({
  stats,
  hosts,
  currentUserId,
  title = 'Company Leaderboard',
  subtitle = 'All hosts in the company.',
  bare = false,
}) => {
  const hasStats = stats !== undefined;

  // Normalise to a unified entry list
  const entries: Array<{ id: number; name: string; stat?: TeamHostStat }> = hasStats
    ? stats.map((s) => ({ id: s.user_id, name: s.name, stat: s }))
    : (hosts ?? []).map((h) => ({ id: h.id, name: h.name }));

  if (entries.length === 0) {
    if (bare) return <p className="text-sm text-slate-400">No hosts found.</p>;
    return (
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-8">
        <p className="text-sm text-slate-400">No hosts found.</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Podium visual order: 2nd | 1st | 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const content = (
    <div className="p-4 space-y-4">
        {/* ── Podium ──────────────────────────────────────────────── */}
        {top3.length > 0 && (
          <div className="flex items-end gap-3">
            {podiumOrder.map((entry) => {
              const rank = entries.indexOf(entry) + 1;
              const styles = PODIUM_STYLES[rank as 1 | 2 | 3];
              const isMe = entry.id === currentUserId;
              const delay = (rank - 1) * TOP3_STAGGER_MS;

              const stat = entry.stat;
              const status = stat ? getStatus(stat) : null;
              const progress = stat ? Math.min(stat.quota_progress, 100) : null;

              return (
                <div
                  key={entry.id}
                  className={[
                    'motion-safe:animate-lb-top',
                    'flex-1 rounded-2xl border p-3 flex flex-col items-center text-center gap-1.5 transition-all duration-150',
                    styles.card,
                    styles.height,
                    isMe ? 'ring-2 ring-teal-400' : '',
                    rank === 1 ? 'self-end pb-4' : '',
                  ].join(' ')}
                  style={{ '--lb-delay': `${delay}ms` } as React.CSSProperties}
                  aria-label={`Rank ${rank}: ${entry.name}${isMe ? ' (you)' : ''}`}
                >
                  <span className="text-lg leading-none">{styles.label}</span>
                  <p className="text-xs font-bold text-slate-800 truncate w-full px-1">{entry.name}</p>
                  {isMe && (
                    <span className="text-[9px] font-semibold text-teal-600 uppercase tracking-wider">You</span>
                  )}
                  {stat && (
                    <>
                      <p className={`text-sm font-extrabold ${styles.coins}`}>
                        {stat.total_coins.toLocaleString()}
                        <span className="text-[10px] font-normal ml-0.5">coins</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {stat.sessions_attended} session{stat.sessions_attended !== 1 ? 's' : ''}
                      </p>
                      {/* Progress bar */}
                      <div className="w-full mt-1">
                        <div className="h-1.5 w-full rounded-full bg-white/60">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${status ? STATUS_BAR[status] : 'bg-slate-300'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {status && (
                          <p className={`text-[9px] font-semibold mt-0.5 ${STATUS_LABEL_COLOR[status]}`}>
                            {STATUS_LABEL[status]}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Ranked rows for rank 4+ ──────────────────────────── */}
        {rest.length > 0 && (
          <ul className="space-y-2" role="list">
            {rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = entry.id === currentUserId;
              const stat = entry.stat;
              const status = stat ? getStatus(stat) : null;
              const delay = top3.length * TOP3_STAGGER_MS + i * STAGGER_MS;

              return (
                <li
                  key={entry.id}
                  className={[
                    ROW_BASE,
                    'motion-safe:animate-lb-row',
                    isMe
                      ? 'bg-teal-50 border-teal-200 text-teal-800'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-teal-50 hover:border-teal-100',
                  ].join(' ')}
                  style={{ '--lb-delay': `${delay}ms` } as React.CSSProperties}
                  aria-label={`Rank ${rank}: ${entry.name}${isMe ? ' (you)' : ''}`}
                >
                  <span className="w-6 text-xs font-bold text-slate-400 shrink-0 text-center">{rank}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{entry.name}</p>
                    {stat && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {stat.sessions_attended} session{stat.sessions_attended !== 1 ? 's' : ''}
                        {status && (
                          <span className={`ml-1.5 font-medium ${STATUS_LABEL_COLOR[status]}`}>
                            · {STATUS_LABEL[status]}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {isMe && (
                    <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider shrink-0">
                      You
                    </span>
                  )}

                  {stat && (
                    <span className="text-xs font-bold text-teal-600 shrink-0">
                      {stat.total_coins.toLocaleString()}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
  );

  if (bare) return content;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-100">
          {title && <h2 className="text-sm font-bold text-slate-900">{title}</h2>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {content}
    </div>
  );
};

export default Leaderboard;
