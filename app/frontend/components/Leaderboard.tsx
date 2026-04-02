import React from 'react';
import type { Host } from '../interfaces/host';

const STAGGER_MS = 60; // delay between rows
const TOP3_STAGGER_MS = 80;

const RANK_COLORS: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-400 text-white' },
  2: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', badge: 'bg-slate-400 text-white' },
  3: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-400 text-white' },
};

interface LeaderboardProps {
  hosts: Host[];
  currentUserId?: number;
  title?: string;
  subtitle?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  hosts,
  currentUserId,
  title = 'Company Leaderboard',
  subtitle = 'All hosts in the company.',
}) => {
  if (hosts.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-8">
        <p className="text-sm text-slate-400">No hosts found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <ul className="p-4 space-y-2" role="list">
        {hosts.map((host, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const isMe = host.id === currentUserId;
          const colors = RANK_COLORS[rank];

          const delay = isTop3
            ? index * TOP3_STAGGER_MS
            : 3 * TOP3_STAGGER_MS + (index - 3) * STAGGER_MS;

          return (
            <li
              key={host.id}
              // motion-safe: only animate when prefers-reduced-motion is not set
              className={[
                'motion-safe:' + (isTop3 ? 'animate-lb-top' : 'animate-lb-row'),
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-150',
                isMe
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : isTop3
                  ? `${colors.bg} ${colors.text}`
                  : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-teal-50 hover:border-teal-100',
              ].join(' ')}
              style={{ '--lb-delay': `${delay}ms` } as React.CSSProperties}
              aria-label={`Rank ${rank}: ${host.name}${isMe ? ' (you)' : ''}`}
            >
              {/* Rank badge */}
              {isTop3 ? (
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${colors?.badge ?? ''}`}
                >
                  {rank}
                </span>
              ) : (
                <span className="w-6 text-xs font-bold text-slate-400 shrink-0 text-center">
                  {rank}
                </span>
              )}

              {/* Name */}
              <span className="flex-1 truncate">{host.name}</span>

              {/* "You" tag */}
              {isMe && (
                <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider shrink-0">
                  You
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Leaderboard;
