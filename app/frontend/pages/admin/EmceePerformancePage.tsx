import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { reportService } from '../../services/reportService';
import type { EmceePerformanceRow } from '../../interfaces/emceePerformance';
import type { DateRange } from '../../interfaces/dateRange';
import { buildDateRange } from '../../components/PeriodSelector';
import PeriodSelector from '../../components/PeriodSelector';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Mic } from 'lucide-react';
import { downloadCsv } from '../../utils/csvExport';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

const EmceePerformancePage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [rows, setRows] = useState<EmceePerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof EmceePerformanceRow>('emcee_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dateRange, setDateRange] = useState<DateRange>(() => buildDateRange('this_month'));
  const [page, setPage] = useState(1);

  const fetchReport = useCallback(
    async (range: DateRange) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await reportService.getEmceePerformance(token, range.startDate, range.endDate);
        setRows(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchReport(dateRange);
    setPage(1);
  }, [fetchReport, dateRange]);

  const handleSort = (field: keyof EmceePerformanceRow) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: keyof EmceePerformanceRow }) => {
    if (sortField !== field) return <ArrowUpDown className="inline w-3 h-3 text-slate-300 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp className="inline w-3 h-3 text-teal-500 ml-1" />
      : <ArrowDown className="inline w-3 h-3 text-teal-500 ml-1" />;
  };

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors';

  const handleExport = () => {
    const headers = ['Emcee', 'Assigned Team(s)', 'Sessions Logged', 'With Coins', '% Completion', 'Last Active'];
    const csvRows = sorted.map((row) => [
      row.emcee_name,
      row.assigned_team_names.join(', '),
      row.sessions_logged,
      row.sessions_with_coins,
      row.completion_pct,
      row.last_active_at
        ? new Date(row.last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '',
    ]);
    downloadCsv('emcee-performance.csv', [headers, ...csvRows]);
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Emcee Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sessions logged and coin completion rate per emcee.</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={dateRange} onChange={setDateRange} />
          {sorted.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400 p-6">Loading...</p>}
      {error && <p className="text-sm text-red-500 p-6">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <Mic className="w-6 h-6 text-teal-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No emcees found</h3>
          <p className="text-xs text-slate-400">Add emcees to the platform to see their performance here.</p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className={thClass} onClick={() => handleSort('emcee_name')}>
                  Emcee <SortIcon field="emcee_name" />
                </th>
                <th className={thClass}>Assigned Team(s)</th>
                <th className={thClass} onClick={() => handleSort('sessions_logged')}>
                  Sessions Logged <SortIcon field="sessions_logged" />
                </th>
                <th className={thClass} onClick={() => handleSort('sessions_with_coins')}>
                  With Coins <SortIcon field="sessions_with_coins" />
                </th>
                <th className={thClass} onClick={() => handleSort('completion_pct')}>
                  % Completion <SortIcon field="completion_pct" />
                </th>
                <th className={thClass} onClick={() => handleSort('last_active_at')}>
                  Last Active <SortIcon field="last_active_at" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((row) => (
                <tr key={row.emcee_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.emcee_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {row.assigned_team_names.length > 0
                      ? row.assigned_team_names.join(', ')
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.sessions_logged}</td>
                  <td className="px-4 py-3 text-slate-700">{row.sessions_with_coins}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-20">
                        <div
                          className={`h-full rounded-full ${row.completion_pct >= 80 ? 'bg-teal-500' : row.completion_pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(row.completion_pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 tabular-nums">{row.completion_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.last_active_at
                      ? new Date(row.last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 sm:px-6 py-3">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmceePerformancePage;
