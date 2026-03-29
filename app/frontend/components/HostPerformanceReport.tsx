import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { reportService } from '../services/reportService';
import { computePresetDates } from '../hooks/useDateRange';
import type { HostPerformanceReport as ReportData } from '../interfaces/hostPerformance';

interface HostPerformanceReportProps {
  hostId: number;
  hostEmail: string;
}

const thisMonth = computePresetDates('this_month');

const slotLabel = (slot: string) => (slot === 'slot_one' ? '1st' : '2nd');

const HostPerformanceReport: React.FC<HostPerformanceReportProps> = ({ hostId, hostEmail }) => {
  const token = useSelector((state: RootState) => state.user.token);

  const [startDate, setStartDate] = useState(thisMonth.startDate);
  const [endDate, setEndDate] = useState(thisMonth.endDate);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    reportService
      .getHostPerformance(token, hostId, startDate, endDate)
      .then(setReport)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token, hostId, startDate, endDate]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-4">
        <h2 className="text-sm font-bold text-slate-900">Host Performance Report</h2>
        <p className="text-xs text-slate-400 mt-0.5">{hostEmail}</p>
      </div>

      {/* Date filter */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From</p>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To</p>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        {report && (
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Period Total
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {report.monthly_total.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Loading / error */}
      {isLoading && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-8">
          <p className="text-sm text-slate-400">Loading performance data...</p>
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-white border border-red-100 shadow-sm px-6 py-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {report && !isLoading && !error && (
        <>
          {/* Session history */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Session History</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All sessions in period — absent sessions are highlighted.
              </p>
            </div>
            {report.sessions.length === 0 ? (
              <p className="px-6 py-6 text-sm text-slate-400">
                No sessions found in this period.
              </p>
            ) : (
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

          {/* Daily + Weekly summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Daily Totals</h3>
              </div>
              {report.daily_totals.length === 0 ? (
                <p className="px-6 py-4 text-sm text-slate-400">No data.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {report.daily_totals.map((d) => (
                    <li key={d.date} className="flex items-center justify-between px-6 py-2.5">
                      <span className="text-sm text-slate-600">{d.date}</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {d.coins.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Weekly Totals</h3>
              </div>
              {report.weekly_totals.length === 0 ? (
                <p className="px-6 py-4 text-sm text-slate-400">No data.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {report.weekly_totals.map((w) => (
                    <li
                      key={w.week_start}
                      className="flex items-center justify-between px-6 py-2.5"
                    >
                      <span className="text-sm text-slate-600">
                        Week of {w.week_start}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {w.coins.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HostPerformanceReport;
