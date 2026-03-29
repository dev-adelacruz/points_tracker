import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { reportService } from '../services/reportService';
import DateRangeFilter from './DateRangeFilter';
import { computePresetDates } from '../hooks/useDateRange';
import type { PeriodComparisonRow, PeriodComparisonParams } from '../interfaces/periodComparison';

interface SortKey {
  field: keyof PeriodComparisonRow;
  dir: 'asc' | 'desc';
}

interface PeriodComparisonReportProps {
  /** Optional override for Period A. Defaults to previous month. */
  defaultPeriodA?: { start: string; end: string };
  /** Optional override for Period B. Defaults to current month. */
  defaultPeriodB?: { start: string; end: string };
  scope?: PeriodComparisonParams['scope'];
  scopeId?: number;
}

const DeltaBadge: React.FC<{ delta: number; deltaPct: number | null }> = ({ delta, deltaPct }) => {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
        <Minus className="w-3 h-3" />—
      </span>
    );
  }

  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        positive ? 'text-green-600' : 'text-red-500'
      }`}
    >
      {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {positive ? '+' : ''}{delta}
      {deltaPct != null && (
        <span className="opacity-70">({positive ? '+' : ''}{deltaPct}%)</span>
      )}
    </span>
  );
};

const thisMonth = computePresetDates('this_month');
const lastMonth = computePresetDates('last_month');

const PeriodComparisonReport: React.FC<PeriodComparisonReportProps> = ({
  defaultPeriodA = { start: lastMonth.startDate, end: lastMonth.endDate },
  defaultPeriodB = { start: thisMonth.startDate, end: thisMonth.endDate },
  scope,
  scopeId,
}) => {
  const token = useSelector((state: RootState) => state.user.token);

  const [periodA, setPeriodA] = useState(defaultPeriodA);
  const [periodB, setPeriodB] = useState(defaultPeriodB);
  const [rows, setRows] = useState<PeriodComparisonRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>({ field: 'entity_name', dir: 'asc' });

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    reportService
      .getPeriodComparison(token, {
        period_a_start: periodA.start,
        period_a_end: periodA.end,
        period_b_start: periodB.start,
        period_b_end: periodB.end,
        scope,
        scope_id: scopeId,
      })
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token, periodA, periodB, scope, scopeId]);

  const sortedRows = [...rows].sort((a, b) => {
    const av = a[sort.field];
    const bv = b[sort.field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: keyof PeriodComparisonRow) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' },
    );
  };

  const SortIcon: React.FC<{ field: keyof PeriodComparisonRow }> = ({ field }) => {
    if (sort.field !== field) return <span className="opacity-20">↕</span>;
    return <span>{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thClass =
    'px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors';
  const tdClass = 'px-4 py-3 text-sm';

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Period-over-Period Comparison</h2>
        <p className="text-xs text-slate-400 mt-0.5">Compare total coins across two time periods.</p>
      </div>

      {/* Period pickers */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-end gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period A</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={periodA.start}
              max={periodA.end}
              onChange={(e) => setPeriodA((p) => ({ ...p, start: e.target.value }))}
              className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="date"
              value={periodA.end}
              min={periodA.start}
              onChange={(e) => setPeriodA((p) => ({ ...p, end: e.target.value }))}
              className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period B</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={periodB.start}
              max={periodB.end}
              onChange={(e) => setPeriodB((p) => ({ ...p, start: e.target.value }))}
              className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="date"
              value={periodB.end}
              min={periodB.start}
              onChange={(e) => setPeriodB((p) => ({ ...p, end: e.target.value }))}
              className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading && (
          <p className="px-6 py-8 text-sm text-slate-400">Loading comparison...</p>
        )}
        {error && (
          <p className="px-6 py-8 text-sm text-red-500">{error}</p>
        )}
        {!isLoading && !error && rows.length === 0 && (
          <p className="px-6 py-8 text-sm text-slate-400">No data available for the selected periods.</p>
        )}
        {!isLoading && !error && rows.length > 0 && (
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={thClass} onClick={() => toggleSort('entity_name')}>
                  Host <SortIcon field="entity_name" />
                </th>
                <th className={thClass} onClick={() => toggleSort('period_a_total')}>
                  Period A <SortIcon field="period_a_total" />
                </th>
                <th className={thClass} onClick={() => toggleSort('period_b_total')}>
                  Period B <SortIcon field="period_b_total" />
                </th>
                <th className={thClass} onClick={() => toggleSort('delta')}>
                  Delta <SortIcon field="delta" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedRows.map((row) => (
                <tr key={row.entity_id} className="hover:bg-slate-50 transition-colors">
                  <td className={`${tdClass} font-medium text-slate-800`}>{row.entity_name}</td>
                  <td className={`${tdClass} text-slate-600`}>{row.period_a_total.toLocaleString()}</td>
                  <td className={`${tdClass} text-slate-600`}>{row.period_b_total.toLocaleString()}</td>
                  <td className={tdClass}>
                    <DeltaBadge delta={row.delta} deltaPct={row.delta_pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PeriodComparisonReport;
