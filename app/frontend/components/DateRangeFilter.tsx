import React, { useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { useDateRange } from '../hooks/useDateRange';
import type { DateRangePreset } from '../interfaces/dateRange';

interface Preset {
  label: string;
  value: DateRangePreset;
}

const PRESETS: Preset[] = [
  { label: 'Today',        value: 'today' },
  { label: 'This Week',    value: 'this_week' },
  { label: 'This Month',   value: 'this_month' },
  { label: 'Last Month',   value: 'last_month' },
  { label: 'Last 7 Days',  value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Custom Range', value: 'custom' },
];

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today:        'Today',
  this_week:    'This Week',
  this_month:   'This Month',
  last_month:   'Last Month',
  last_7_days:  'Last 7 Days',
  last_30_days: 'Last 30 Days',
  custom:       'Custom Range',
};

interface DateRangeFilterProps {
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ className = '' }) => {
  const [{ preset, startDate, endDate }, setDateRange] = useDateRange();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(preset === 'custom');
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handlePresetClick = (value: DateRangePreset) => {
    if (value === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setDateRange(value);
      setOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setDateRange('custom', customStart, customEnd);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRange('this_month');
    setOpen(false);
  };

  const isNonDefault = preset !== 'this_month';

  const displayLabel =
    preset === 'custom'
      ? `${startDate} → ${endDate}`
      : PRESET_LABELS[preset];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="whitespace-nowrap">{displayLabel}</span>
        {isNonDefault ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-slate-200 transition-colors"
            aria-label="Clear date filter"
          >
            <X className="w-3 h-3 text-slate-500" />
          </button>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-20 w-56 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden">
            <ul role="listbox" className="py-1">
              {PRESETS.map(({ label, value }) => (
                <li key={value} role="option" aria-selected={preset === value}>
                  <button
                    type="button"
                    onClick={() => handlePresetClick(value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      preset === value
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Custom range picker */}
            {showCustom && (
              <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || undefined}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    End date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full h-8 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeFilter;
