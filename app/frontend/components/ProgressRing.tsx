import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max,
  size = 88,
  strokeWidth = 6,
  color = '#14b8a6',
  trackColor = '#e2e8f0',
  label,
}) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(pct));
    });
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const offset = circumference * (1 - animated);
  const displayPct = Math.round(pct * 100);

  return (
    <div
      className="relative shrink-0"
      role="img"
      aria-label={label ? `${label}: ${displayPct}%` : `${displayPct}%`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-slate-700 leading-none">
          {displayPct}%
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
