import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { reportService } from '../services/reportService';
import { computePresetDates } from '../hooks/useDateRange';
import type { TeamTotalsRow } from '../interfaces/teamTotals';

type SortField = keyof TeamTotalsRow;
type SortDir = 'asc' | 'desc';

const thisMonth = computePresetDates('this_month');

const TeamTotalsReport: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [startDate, setStartDate] = useState(thisMonth.startDate);
  const [endDate, setEndDate] = useState(thisMonth.endDate);
  const [rows, setRows] = useState<TeamTotalsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: 'total_coins',
    dir: 'desc',
  });

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    reportService
      .getTeamTotals(token, startDate, endDate)
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token, startDate, endDate]);

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' },
    );
  };

  const sortedRows = [...rows].sort((a, b) => {
    const av = a[sort.field];
    const bv = b[sort.field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sort.field !== field) return <span className="opacity-20">↕</span>;
    return <span>{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thClass =
    'px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors';
  const tdClass = 'px-4 py-3 text-sm';

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Team Totals Report</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Coin totals per team for a selected period.
        </p>
      </div>

      {/* Date filter */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            From
          </p>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            To
          </p>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading && (
          <p className="px-6 py-8 text-sm text-slate-400">Loading team totals...</p>
        )}
        {error && <p className="px-6 py-8 text-sm text-red-500">{error}</p>}
        {!isLoading && !error && rows.length === 0 && (
          <p className="px-6 py-8 text-sm text-slate-400">
            No teams found for the selected period.
          </p>
        )}
        {!isLoading && !error && rows.length > 0 && (
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={thClass} onClick={() => toggleSort('team_name')}>
                  Team <SortIcon field="team_name" />
                </th>
                <th className={thClass} onClick={() => toggleSort('emcee_email')}>
                  Emcee <SortIcon field="emcee_email" />
                </th>
                <th className={thClass} onClick={() => toggleSort('total_coins')}>
                  Total Coins <SortIcon field="total_coins" />
                </th>
                <th className={thClass} onClick={() => toggleSort('host_count')}>
                  Hosts <SortIcon field="host_count" />
                </th>
                <th className={thClass} onClick={() => toggleSort('avg_coins_per_host')}>
                  Avg / Host <SortIcon field="avg_coins_per_host" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedRows.map((row) => (
                <tr key={row.team_id} className="hover:bg-slate-50 transition-colors">
                  <td className={`${tdClass} font-semibold text-slate-800`}>
                    {row.team_name}
                  </td>
                  <td className={`${tdClass} text-slate-500`}>
                    {row.emcee_email ?? <span className="text-slate-300 italic">Unassigned</span>}
                  </td>
                  <td className={`${tdClass} text-slate-700 font-medium`}>
                    {row.total_coins.toLocaleString()}
                  </td>
                  <td className={`${tdClass} text-slate-600`}>{row.host_count}</td>
                  <td className={`${tdClass} text-slate-600`}>
                    {row.avg_coins_per_host.toLocaleString()}
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

export default TeamTotalsReport;
