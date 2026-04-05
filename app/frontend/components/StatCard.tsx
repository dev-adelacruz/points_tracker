import React from 'react';
import type { LucideIcon } from 'lucide-react';

const ACCENT_STYLES = {
  teal: {
    value: 'text-teal-500',
    icon: 'text-teal-600 bg-teal-50',
    glow: 'rgb(20 184 166 / 0.15)',
  },
  amber: {
    value: 'text-amber-500',
    icon: 'text-amber-600 bg-amber-50',
    glow: 'rgb(245 158 11 / 0.15)',
  },
  blue: {
    value: 'text-teal-500',
    icon: 'text-teal-600 bg-teal-50',
    glow: 'rgb(20 184 166 / 0.15)',
  },
  violet: {
    value: 'text-violet-500',
    icon: 'text-violet-600 bg-violet-50',
    glow: 'rgb(139 92 246 / 0.15)',
  },
} as const;

type Accent = keyof typeof ACCENT_STYLES;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, accent = 'teal' }) => {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className="rounded-2xl bg-white border border-slate-100 p-5 transition-all duration-200 hover:shadow-md"
      style={{
        boxShadow: `0 1px 3px rgb(0 0 0 / 0.06), 0 0 20px ${styles.glow}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}
          aria-hidden="true"
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className={`text-[2rem] font-bold leading-none tracking-tight ${styles.value}`}>
            {value}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1.5 leading-tight">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
