import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { hostService } from '../services/hostService';
import { computePresetDates } from '../hooks/useDateRange';
import type { HostPerformanceReport } from '../interfaces/hostPerformance';

type Preset = 'this_week' | 'this_month' | 'custom';

const slotLabel = (slot: string) => (slot === 'slot_one' ? '1st' : '2nd');

const thisMonth = computePresetDates('this_month');

const MyPerformanceSection: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [preset, setPreset] = useState<Preset>('this_month');
  const [startDate, setStartDate] = useState(thisMonth.startDate);
  const [endDate, setEndDate] = useState(thisMonth.endDate);
  const [report, setReport] = useState<HostPerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const dates = computePresetDates(p);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    hostService
      .getMyPerformance(token, startDate, endDate)
      .then(setReport)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token, startDate, endDate]);

  const presetButtons: { key: Preset; label: string }[] = [
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">My Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sessions attended and coins earned.</p>
        </div>
        {report && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period Total</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {report.monthly_total.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Date filter */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-end gap-4">
        <div className="flex gap-1">
          {presetButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`text-xs font-semibold px-3 py-2 sm:py-1.5 rounded-lg border transition-colors min-h-12 sm:min-h-0 ${
                preset === key
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 sm:min-h-0 min-h-12 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 w-full sm:w-auto"
            />
            <span className="text-slate-400 text-xs hidden sm:inline">→</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 sm:min-h-0 min-h-12 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 w-full sm:w-auto"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <p className="px-6 py-8 text-sm text-slate-400">Loading performance data...</p>
      )}
      {error && (
        <p className="px-6 py-8 text-sm text-red-500">{error}</p>
      )}
      {!isLoading && !error && report && report.sessions.length === 0 && (
        <p className="px-6 py-8 text-sm text-slate-400">No sessions found for the selected period.</p>
      )}
      {!isLoading && !error && report && report.sessions.length > 0 && (
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Slot
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Coins
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {report.sessions.map((s) => (
              <tr
                key={s.session_id}
                className={s.attended ? 'hover:bg-slate-50' : 'bg-red-50/50 hover:bg-red-50'}
              >
                <td className="px-4 py-3 text-sm text-slate-700">{s.date}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{slotLabel(s.session_slot)}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                  {s.attended ? s.coins.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {s.attended ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      Attended
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                      Absent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyPerformanceSection;
