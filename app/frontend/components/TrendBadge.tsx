import React from 'react';

interface TrendBadgeProps {
  deltaPct: number | null;
  suffix?: string;
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ deltaPct, suffix = 'vs prev' }) => {
  if (deltaPct === null || deltaPct === undefined) return null;

  if (deltaPct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-ok">
        ▲ {Math.round(deltaPct)}% {suffix}
      </span>
    );
  }

  if (deltaPct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-bad">
        ▼ {Math.round(Math.abs(deltaPct))}% {suffix}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
      — {suffix}
    </span>
  );
};

export default TrendBadge;
