import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import type { Team } from '../../interfaces/team';
import { Modal, FormError, SubmitButton, CloseButton } from '../../components/AdminShared';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { Users } from 'lucide-react';

const PAGE_SIZE = 10;

const TeamsPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const { showToast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] = useState<Team | null>(null);

  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);

  useEffect(() => {
    if (!token) return;
    teamService.getTeams(token)
      .then(setTeams)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditingTeam(null); setFormName(''); setFormDesc(''); setFormError(null);
    setShowModal(true);
  };
  const openEdit = (t: Team) => {
    setEditingTeam(t); setFormName(t.name); setFormDesc(t.description ?? ''); setFormError(null);
    setShowModal(true);
  };
  const closeModal = useCallback(() => setShowModal(false), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true); setFormError(null);
    try {
      if (editingTeam) {
        const updated = await teamService.updateTeam(token, editingTeam.id, { name: formName, description: formDesc || undefined });
        setTeams((prev) => prev.map((t) => t.id === updated.id ? updated : t));
        showToast({ message: `Team "${updated.name}" updated.`, variant: 'success' });
      } else {
        const created = await teamService.createTeam(token, { name: formName, description: formDesc || undefined });
        setTeams((prev) => [...prev, created]);
        showToast({ message: `Team "${created.name}" created.`, variant: 'success' });
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
      showToast({ message: err.message, variant: 'error' });
    }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (team: Team) => {
    if (!token) return;
    try {
      const updated = await teamService.deactivateTeam(token, team.id);
      setTeams((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    } catch (err: any) { setError(err.message); }
    finally { setConfirmDeactivate(null); }
  };

  const activeTeams = teams.filter((t) => t.active);
  const inactiveTeams = teams.filter((t) => !t.active);

  const activeTotalPages = Math.ceil(activeTeams.length / PAGE_SIZE);
  const inactiveTotalPages = Math.ceil(inactiveTeams.length / PAGE_SIZE);
  const pagedActive = activeTeams.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const pagedInactive = inactiveTeams.slice((inactivePage - 1) * PAGE_SIZE, inactivePage * PAGE_SIZE);

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Teams</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create, rename, and deactivate teams.</p>
          </div>
          <button onClick={openCreate} className="text-xs font-semibold px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 min-h-12 sm:min-h-0">+ New Team</button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && teams.length === 0 && (
            <EmptyState
              icon={Users}
              title="No teams yet"
              description="Teams group your hosts together. Create your first team to get started."
              ctaLabel="+ Create your first team"
              onCta={openCreate}
            />
          )}

          {pagedActive.length > 0 && (
            <>
              <ul className="space-y-2">
                {pagedActive.map((team) => (
                  <li key={team.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{team.name}</p>
                      {team.description && <p className="text-xs text-slate-400 truncate">{team.description}</p>}
                      {team.emcee_name && <p className="text-xs text-teal-600">Emcee: {team.emcee_name}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{team.host_count} host{team.host_count !== 1 ? 's' : ''}</span>
                    <button onClick={() => openEdit(team)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0 min-h-12 sm:min-h-0 px-2 sm:px-0">Edit</button>
                    <button onClick={() => setConfirmDeactivate(team)} className="text-xs font-medium text-red-500 hover:text-red-700 shrink-0 min-h-12 sm:min-h-0 px-2 sm:px-0">Deactivate</button>
                  </li>
                ))}
              </ul>
              <Pagination currentPage={activePage} totalPages={activeTotalPages} onPageChange={setActivePage} />
            </>
          )}

          {pagedInactive.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Inactive</p>
              <ul className="space-y-2">
                {pagedInactive.map((team) => (
                  <li key={team.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 opacity-50">
                    <p className="text-sm font-semibold text-slate-500 line-through flex-1">{team.name}</p>
                    <span className="text-xs text-slate-400">Deactivated</span>
                  </li>
                ))}
              </ul>
              <Pagination currentPage={inactivePage} totalPages={inactiveTotalPages} onPageChange={setInactivePage} />
            </div>
          )}
        </div>
      </div>

      {/* Create / edit modal */}
      <Modal open={showModal} onClose={closeModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{editingTeam ? 'Edit Team' : 'New Team'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{editingTeam ? `Updating "${editingTeam.name}"` : 'Add a new team to the roster.'}</p>
          </div>
          <CloseButton onClick={closeModal} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-3">
            {formError && <FormError message={formError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team Name</label>
              <input
                type="text"
                placeholder="e.g. Alpha Squad"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="Short description"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={submitting} label={editingTeam ? 'Save Changes' : 'Create Team'} loadingLabel="Saving…" />
          </div>
        </form>
      </Modal>

      {/* Confirm deactivate modal */}
      <Modal open={!!confirmDeactivate} onClose={() => setConfirmDeactivate(null)} maxWidth="max-w-sm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deactivate Team</h3>
              <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Deactivate <span className="font-semibold text-slate-800">"{confirmDeactivate?.name}"</span>? Historical session and coin data will be preserved.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
          <button onClick={() => setConfirmDeactivate(null)} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => confirmDeactivate && handleDeactivate(confirmDeactivate)}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150"
          >
            Deactivate
          </button>
        </div>
      </Modal>
    </>
  );
};

export default TeamsPage;
