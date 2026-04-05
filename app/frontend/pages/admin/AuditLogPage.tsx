import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { auditLogService, AuditLogFilters } from '../../services/auditLogService';
import type { AuditLog, AuditLogMeta } from '../../interfaces/auditLog';
import Pagination from '../../components/Pagination';
import { ShieldCheck } from 'lucide-react';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create:     { label: 'Create',     color: 'bg-teal-100 text-teal-700' },
  update:     { label: 'Update',     color: 'bg-blue-100 text-blue-700' },
  deactivate: { label: 'Deactivate', color: 'bg-red-100 text-red-700' },
};

const RESOURCE_TYPES = ['User', 'Team', 'Session', 'CoinEntry'];
const ACTION_TYPES   = ['create', 'update', 'deactivate'];

const AuditLogPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [meta, setMeta]     = useState<AuditLogMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [page, setPage]               = useState(1);
  const [filterAction, setFilterAction]     = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  const fetchLogs = useCallback(
    async (filters: AuditLogFilters) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await auditLogService.getAuditLogs(token, filters);
        setLogs(result.data);
        setMeta(result.meta);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchLogs({
      page,
      ...(filterAction ? { action_type: filterAction } : {}),
      ...(filterResource ? { resource_type: filterResource } : {}),
      ...(filterDateFrom ? { date_from: filterDateFrom } : {}),
      ...(filterDateTo ? { date_to: filterDateTo } : {}),
    });
  }, [fetchLogs, page, filterAction, filterResource, filterDateFrom, filterDateTo]);

  const handleFilterChange = () => setPage(1);

  const formatChanges = (changes: Record<string, [unknown, unknown]>) => {
    const entries = Object.entries(changes);
    if (entries.length === 0) return null;
    return entries.map(([field, [before, after]]) => (
      <div key={field} className="text-[10px] text-slate-500">
        <span className="font-medium text-slate-600">{field}:</span>{' '}
        <span className="line-through text-red-400">{String(before ?? '—')}</span>
        {' → '}
        <span className="text-teal-600">{String(after ?? '—')}</span>
      </div>
    ));
  };

  const selectClass = "text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow";

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Audit Log</h2>
          <p className="text-xs text-slate-400 mt-0.5">All significant admin actions across the platform.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); handleFilterChange(); }} className={selectClass}>
            <option value="">All actions</option>
            {ACTION_TYPES.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
          <select value={filterResource} onChange={(e) => { setFilterResource(e.target.value); handleFilterChange(); }} className={selectClass}>
            <option value="">All resources</option>
            {RESOURCE_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); handleFilterChange(); }} className={selectClass} placeholder="From" />
          <input type="date" value={filterDateTo} min={filterDateFrom} onChange={(e) => { setFilterDateTo(e.target.value); handleFilterChange(); }} className={selectClass} placeholder="To" />
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400 p-6">Loading...</p>}
      {error && <p className="text-sm text-red-500 p-6">{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-teal-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No audit entries</h3>
          <p className="text-xs text-slate-400">Admin actions will appear here as they occur.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const actionMeta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-800">{log.actor_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${actionMeta.color}`}>
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-700">{log.resource_type}</p>
                        <p className="text-[10px] text-slate-400">{log.resource_label ?? `#${log.resource_id}`}</p>
                      </td>
                      <td className="px-4 py-3 space-y-0.5">
                        {formatChanges(log.changes) ?? <span className="text-[10px] text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.total_pages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogPage;
