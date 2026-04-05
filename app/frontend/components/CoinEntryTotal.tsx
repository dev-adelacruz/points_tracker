import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Session } from '../interfaces/session';

interface CoinEntryTotalProps {
  coinsForm: Record<number, string>;
  hostIds: number[];
  /** Sessions already loaded — used to derive the team historical average */
  sessions: Session[];
  currentSessionId: number;
  teamId: number;
}

const CoinEntryTotal: React.FC<CoinEntryTotalProps> = ({
  coinsForm,
  hostIds,
  sessions,
  currentSessionId,
  teamId,
}) => {
  const hostCount = hostIds.length;
  if (hostCount === 0) return null;

  const total = hostIds.reduce((sum, hid) => sum + Math.max(0, Number(coinsForm[hid] ?? 0)), 0);
  const avg = Math.round(total / hostCount);

  // Historical average: sessions for the same team (excluding this session, with coin_total > 0)
  const historicalSessions = sessions.filter(
    (s) => s.team_id === teamId && s.id !== currentSessionId && s.coin_total > 0,
  );
  const historicalAvg =
    historicalSessions.length > 0
      ? Math.round(
          historicalSessions.reduce((sum, s) => sum + s.coin_total, 0) / historicalSessions.length,
        )
      : null;

  // Flag conditions
  const isZero = total === 0;
  const isHigh = historicalAvg !== null && total > historicalAvg * 2.5;
  const isLow = historicalAvg !== null && total > 0 && total < historicalAvg * 0.3;
  const flagged = isZero || isHigh || isLow;

  const flagMessage = isZero
    ? 'No coins entered yet'
    : isHigh
    ? `Unusually high (team avg ~${historicalAvg!.toLocaleString()})`
    : isLow
    ? `Unusually low (team avg ~${historicalAvg!.toLocaleString()})`
    : null;

  return (
    <div className={`mx-6 mb-4 rounded-xl px-4 py-3 ${flagged ? 'bg-amber-50 border border-amber-100' : 'bg-teal-50 border border-teal-100'}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-700">
            Total this session
          </p>
          <p className={`text-xl font-extrabold mt-0.5 ${flagged ? 'text-amber-600' : 'text-teal-600'}`}>
            {total.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">coins</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">avg per host</p>
          <p className="text-base font-bold text-slate-700">{avg.toLocaleString()}</p>
        </div>
      </div>

      {flagMessage && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600 font-medium">{flagMessage}</p>
        </div>
      )}
    </div>
  );
};

export default CoinEntryTotal;
