import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import { emceeService } from '../../services/emceeService';
import type { Team } from '../../interfaces/team';
import type { Emcee } from '../../interfaces/emcee';
import { Modal, FormError, SubmitButton, CloseButton } from '../../components/AdminShared';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

const EmceesPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [emcees, setEmcees] = useState<Emcee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assigningEmcee, setAssigningEmcee] = useState<Emcee | null>(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      emceeService.getEmcees(token),
      teamService.getTeams(token),
    ])
      .then(([e, t]) => { setEmcees(e); setTeams(t); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const openAssign = (emcee: Emcee) => {
    setAssigningEmcee(emcee); setAssignTeamId(''); setAssignError(null);
  };
  const closeAssign = useCallback(() => { setAssigningEmcee(null); setAssignError(null); }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !assigningEmcee || !assignTeamId) return;
    setAssignSubmitting(true); setAssignError(null);
    try {
      await teamService.assignEmcee(token, Number(assignTeamId), assigningEmcee.id);
      const [updatedTeams, updatedEmcees] = await Promise.all([
        teamService.getTeams(token),
        emceeService.getEmcees(token),
      ]);
      setTeams(updatedTeams);
      setEmcees(updatedEmcees);
      closeAssign();
    } catch (err: any) { setAssignError(err.message); }
    finally { setAssignSubmitting(false); }
  };

  const activeTeams = teams.filter((t) => t.active);
  const totalPages = Math.ceil(emcees.length / PAGE_SIZE);
  const pagedEmcees = emcees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Emcees</h2>
          <p className="text-xs text-slate-400 mt-0.5">View emcees and manage their team assignments.</p>
        </div>

        <div className="p-6">
          {loading && <p className="text-sm text-slate-400">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && emcees.length === 0 && <p className="text-sm text-slate-400">No emcees found.</p>}

          {pagedEmcees.length > 0 && (
            <>
              <ul className="space-y-2">
                {pagedEmcees.map((emcee) => (
                  <li key={emcee.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{emcee.name}</p>
                      {emcee.teams.length > 0
                        ? <p className="text-xs text-slate-400">{emcee.teams.map((t) => t.name).join(', ')}</p>
                        : <p className="text-xs text-slate-400">No team assigned</p>}
                    </div>
                    <button onClick={() => openAssign(emcee)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0 min-h-12 sm:min-h-0 px-2 sm:px-0">Assign Team</button>
                  </li>
                ))}
              </ul>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>

      {/* Assign team modal */}
      <Modal open={!!assigningEmcee} onClose={closeAssign}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assign Team</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{assigningEmcee?.name}</p>
          </div>
          <CloseButton onClick={closeAssign} />
        </div>
        <form onSubmit={handleAssignSubmit}>
          <div className="px-6 py-5 space-y-3">
            {assignError && <FormError message={assignError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team</label>
              <select
                value={assignTeamId}
                onChange={(e) => setAssignTeamId(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">Select a team</option>
                {activeTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeAssign} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={assignSubmitting} label="Assign" loadingLabel="Assigning…" />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default EmceesPage;
