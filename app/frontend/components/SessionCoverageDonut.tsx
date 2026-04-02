import React from 'react';
import type { Session } from '../interfaces/session';

interface SessionCoverageDonutProps {
  sessions: Session[];
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SessionCoverageDonut: React.FC<SessionCoverageDonutProps> = ({ sessions }) => {
  const total = sessions.length;
  const logged = sessions.filter((s) => s.coin_total > 0).length;
  const pending = total - logged;
  const coveragePct = total > 0 ? Math.round((logged / total) * 100) : 0;
  const loggedArc = total > 0 ? (logged / total) * CIRCUMFERENCE : 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          {/* Background ring (pending) */}
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            fill="none"
            stroke="#fef3c7"
            strokeWidth="10"
          />
          {/* Foreground arc (logged) */}
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="10"
            strokeDasharray={`${loggedArc} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{coveragePct}%</span>
          <span className="text-[9px] text-slate-400 font-medium">logged</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              <span className="text-xs text-slate-600 font-medium">Coins Logged</span>
            </div>
            <span className="text-xs font-bold text-teal-600">{logged}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-700"
              style={{ width: total > 0 ? `${(logged / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
              <span className="text-xs text-slate-600 font-medium">Pending</span>
            </div>
            <span className="text-xs font-bold text-amber-500">{pending}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-300 transition-all duration-700"
              style={{ width: total > 0 ? `${(pending / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-400">{total} session{total !== 1 ? 's' : ''} total this month</p>
      </div>
    </div>
  );
};

export default SessionCoverageDonut;
