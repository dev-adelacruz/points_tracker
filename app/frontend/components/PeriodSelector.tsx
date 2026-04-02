import React, { useState } from 'react';
import type { DateRange, DateRangePreset } from '../interfaces/dateRange';

// ---------------------------------------------------------------------------
// Date calculation helpers
// ---------------------------------------------------------------------------
export const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

export const buildDateRange = (preset: DateRangePreset, customStart?: string, customEnd?: string): DateRange => {
  const now = new Date();
  const today = toDateStr(now);

  switch (preset) {
    case 'today':
      return { preset, startDate: today, endDate: today };

    case 'this_week': {
      const day = now.getDay(); // 0 = Sunday
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      return { preset, startDate: toDateStr(monday), endDate: today };
    }

    case 'this_month': {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { preset, startDate: start, endDate: today };
    }

    case 'last_month': {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 1);
      const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);
      return { preset, startDate: toDateStr(firstOfLastMonth), endDate: toDateStr(lastOfLastMonth) };
    }

    case 'custom':
      return { preset, startDate: customStart ?? today, endDate: customEnd ?? today };

    default:
      return { preset: 'this_month', startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, endDate: today };
  }
};

// ---------------------------------------------------------------------------
// Preset label map
// ---------------------------------------------------------------------------
const PRESET_LABELS: Record<Exclude<DateRangePreset, 'last_7_days' | 'last_30_days'>, string> = {
  today: 'Today',
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  custom: 'Custom Range',
};

const PRESETS: Exclude<DateRangePreset, 'last_7_days' | 'last_30_days'>[] = [
  'today',
  'this_week',
  'this_month',
  'last_month',
  'custom',
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PeriodSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const [customError, setCustomError] = useState<string | null>(null);

  const handlePreset = (preset: Exclude<DateRangePreset, 'last_7_days' | 'last_30_days'>) => {
    if (preset === 'custom') {
      setCustomStart(value.startDate);
      setCustomEnd(value.endDate);
      setCustomError(null);
      onChange({ preset: 'custom', startDate: value.startDate, endDate: value.endDate });
    } else {
      onChange(buildDateRange(preset));
    }
  };

  const handleCustomApply = () => {
    if (customStart > customEnd) {
      setCustomError('Start date must be before or equal to end date.');
      return;
    }
    setCustomError(null);
    onChange({ preset: 'custom', startDate: customStart, endDate: customEnd });
  };

  return (
    <div className="space-y-2">
      {/* Pill row */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map((preset) => {
          const active = value.preset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150 active:scale-95 ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {PRESET_LABELS[preset]}
            </button>
          );
        })}
      </div>

      {/* Custom date range inputs */}
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
          />
          <button
            type="button"
            onClick={handleCustomApply}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
          >
            Apply
          </button>
          {customError && (
            <span className="text-xs text-red-500">{customError}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;
