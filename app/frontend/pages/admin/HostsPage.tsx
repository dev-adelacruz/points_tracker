import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import { Modal, FormError, SubmitButton, CloseButton } from '../../components/AdminShared';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { UserCheck } from 'lucide-react';

const PAGE_SIZE = 10;

const HostsPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const { showToast } = useToast();

  const [hosts, setHosts] = useState<Host[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formTeamId, setFormTeamId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] = useState<Host | null>(null);

  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      hostService.getHosts(token),
      teamService.getTeams(token),
    ])
      .then(([h, t]) => { setHosts(h); setTeams(t); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditingHost(null); setFormName(''); setFormEmail(''); setFormPassword(''); setFormTeamId(''); setFormError(null);
    setShowModal(true);
  };
  const openEdit = (h: Host) => {
    setEditingHost(h); setFormName(h.name); setFormEmail(h.email); setFormPassword(''); setFormTeamId(h.team_id ? String(h.team_id) : ''); setFormError(null);
    setShowModal(true);
  };
  const closeModal = useCallback(() => setShowModal(false), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true); setFormError(null);
    try {
      if (editingHost) {
        const updated = await hostService.updateHost(token, editingHost.id, {
          name: formName,
          email: formEmail,
          ...(formPassword ? { password: formPassword } : {}),
          team_id: formTeamId ? Number(formTeamId) : null,
        });
        setHosts((prev) => prev.map((h) => h.id === updated.id ? updated : h));
        showToast({ message: `Host "${updated.name}" updated.`, variant: 'success' });
      } else {
        const created = await hostService.createHost(token, {
          name: formName,
          email: formEmail,
          password: formPassword,
          ...(formTeamId ? { team_id: Number(formTeamId) } : {}),
        });
        setHosts((prev) => [...prev, created]);
        showToast({ message: `Host "${created.name}" created.`, variant: 'success' });
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
      showToast({ message: err.message, variant: 'error' });
    }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (host: Host) => {
    if (!token) return;
    try {
      const updated = await hostService.deactivateHost(token, host.id);
      setHosts((prev) => prev.map((h) => h.id === updated.id ? updated : h));
    } catch (err: any) { setError(err.message); }
    finally { setConfirmDeactivate(null); }
  };

  const activeTeams = teams.filter((t) => t.active);
  const activeHosts = hosts.filter((h) => h.active);
  const inactiveHosts = hosts.filter((h) => !h.active);

  const activeTotalPages = Math.ceil(activeHosts.length / PAGE_SIZE);
  const inactiveTotalPages = Math.ceil(inactiveHosts.length / PAGE_SIZE);
  const pagedActive = activeHosts.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const pagedInactive = inactiveHosts.slice((inactivePage - 1) * PAGE_SIZE, inactivePage * PAGE_SIZE);

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Hosts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create, edit, and deactivate host accounts.</p>
          </div>
          <button onClick={openCreate} className="text-xs font-semibold px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 min-h-12 sm:min-h-0">+ New Host</button>
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
          {!loading && !error && hosts.length === 0 && (
            <EmptyState
              icon={UserCheck}
              title="No hosts yet"
              description="Hosts are the people who earn coins each session. Add your first host to begin tracking."
              ctaLabel="+ Add your first host"
              onCta={openCreate}
            />
          )}

          {pagedActive.length > 0 && (
            <>
              <ul className="space-y-2">
                {pagedActive.map((host) => (
                  <li key={host.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{host.name}</p>
                      {host.team_name && <p className="text-xs text-slate-400">{host.team_name}</p>}
                    </div>
                    <button onClick={() => openEdit(host)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0 min-h-12 sm:min-h-0 px-2 sm:px-0">Edit</button>
                    <button onClick={() => setConfirmDeactivate(host)} className="text-xs font-medium text-red-500 hover:text-red-700 shrink-0 min-h-12 sm:min-h-0 px-2 sm:px-0">Deactivate</button>
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
                {pagedInactive.map((host) => (
                  <li key={host.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 opacity-50">
                    <p className="text-sm font-semibold text-slate-500 line-through flex-1">{host.name}</p>
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
            <h2 className="text-sm font-bold text-slate-900">{editingHost ? 'Edit Host' : 'New Host'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{editingHost ? `Editing ${editingHost.name}` : 'Create a new host account.'}</p>
          </div>
          <CloseButton onClick={closeModal} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-3">
            {formError && <FormError message={formError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                placeholder="e.g. Juan dela Cruz"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="host@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Password {editingHost && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                placeholder={editingHost ? '••••••••' : 'Min. 6 characters'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                {...(!editingHost ? { required: true } : {})}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team <span className="text-slate-400 font-normal">(optional)</span></label>
              <select
                value={formTeamId}
                onChange={(e) => setFormTeamId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">No team assigned</option>
                {activeTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={submitting} label={editingHost ? 'Save Changes' : 'Create Host'} loadingLabel="Saving…" />
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
              <h3 className="text-sm font-bold text-slate-900">Deactivate Host</h3>
              <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Deactivate <span className="font-semibold text-slate-800">"{confirmDeactivate?.name}"</span>? All historical coin data will be preserved.
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

export default HostsPage;
