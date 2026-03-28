import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { emceeService } from '../../services/emceeService';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import type { Emcee } from '../../interfaces/emcee';

type Tab = 'teams' | 'hosts' | 'emcees' | 'sessions';

// ---------------------------------------------------------------------------
// Shared Modal primitive — handles mount/unmount animation, backdrop, Escape
// ---------------------------------------------------------------------------
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, maxWidth = 'max-w-md' }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}>
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shared error banner
// ---------------------------------------------------------------------------
const FormError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <p className="text-xs text-red-600">{message}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Submit button with spinner
// ---------------------------------------------------------------------------
const SubmitButton: React.FC<{ loading: boolean; label: string; loadingLabel: string }> = ({ loading, label, loadingLabel }) => (
  <button
    type="submit"
    disabled={loading}
    className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 min-w-[110px] text-center"
  >
    {loading ? (
      <span className="flex items-center justify-center gap-1.5">
        <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        {loadingLabel}
      </span>
    ) : label}
  </button>
);

// ---------------------------------------------------------------------------
// Close (×) button for modal headers
// ---------------------------------------------------------------------------
const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
    aria-label="Close"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
);

// ---------------------------------------------------------------------------
// Admin Dashboard
// ---------------------------------------------------------------------------
const AdminDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const [activeTab, setActiveTab] = useState<Tab>('teams');

  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormDesc, setTeamFormDesc] = useState('');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [confirmDeactivateTeam, setConfirmDeactivateTeam] = useState<Team | null>(null);

  // Hosts state
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [hostsError, setHostsError] = useState<string | null>(null);
  const [showHostModal, setShowHostModal] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [hostFormEmail, setHostFormEmail] = useState('');
  const [hostFormPassword, setHostFormPassword] = useState('');
  const [hostFormTeamId, setHostFormTeamId] = useState('');
  const [hostFormError, setHostFormError] = useState<string | null>(null);
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [confirmDeactivateHost, setConfirmDeactivateHost] = useState<Host | null>(null);

  // Emcees state
  const [emcees, setEmcees] = useState<Emcee[]>([]);
  const [emceesLoading, setEmceesLoading] = useState(true);
  const [emceesError, setEmceesError] = useState<string | null>(null);
  const [assigningEmcee, setAssigningEmcee] = useState<Emcee | null>(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    teamService.getTeams(token).then(setTeams).catch((e: Error) => setTeamsError(e.message)).finally(() => setTeamsLoading(false));
    hostService.getHosts(token).then(setHosts).catch((e: Error) => setHostsError(e.message)).finally(() => setHostsLoading(false));
    emceeService.getEmcees(token).then(setEmcees).catch((e: Error) => setEmceesError(e.message)).finally(() => setEmceesLoading(false));
  }, [token]);

  // ---- Team handlers ----
  const openCreateTeam = () => {
    setEditingTeam(null); setTeamFormName(''); setTeamFormDesc(''); setTeamFormError(null);
    setShowTeamModal(true);
  };
  const openEditTeam = (t: Team) => {
    setEditingTeam(t); setTeamFormName(t.name); setTeamFormDesc(t.description ?? ''); setTeamFormError(null);
    setShowTeamModal(true);
  };
  const closeTeamModal = useCallback(() => { setShowTeamModal(false); }, []);

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTeamSubmitting(true); setTeamFormError(null);
    try {
      if (editingTeam) {
        const updated = await teamService.updateTeam(token, editingTeam.id, { name: teamFormName, description: teamFormDesc || undefined });
        setTeams((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      } else {
        const created = await teamService.createTeam(token, { name: teamFormName, description: teamFormDesc || undefined });
        setTeams((prev) => [...prev, created]);
      }
      closeTeamModal();
    } catch (err: any) { setTeamFormError(err.message); }
    finally { setTeamSubmitting(false); }
  };

  const handleDeactivateTeam = async (team: Team) => {
    if (!token) return;
    try {
      const updated = await teamService.deactivateTeam(token, team.id);
      setTeams((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    } catch (err: any) { setTeamsError(err.message); }
    finally { setConfirmDeactivateTeam(null); }
  };

  // ---- Host handlers ----
  const openCreateHost = () => {
    setEditingHost(null); setHostFormEmail(''); setHostFormPassword(''); setHostFormTeamId(''); setHostFormError(null);
    setShowHostModal(true);
  };
  const openEditHost = (h: Host) => {
    setEditingHost(h); setHostFormEmail(h.email); setHostFormPassword(''); setHostFormTeamId(h.team_id ? String(h.team_id) : ''); setHostFormError(null);
    setShowHostModal(true);
  };
  const closeHostModal = useCallback(() => { setShowHostModal(false); }, []);

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setHostSubmitting(true); setHostFormError(null);
    try {
      if (editingHost) {
        const updated = await hostService.updateHost(token, editingHost.id, {
          email: hostFormEmail,
          ...(hostFormPassword ? { password: hostFormPassword } : {}),
          team_id: hostFormTeamId ? Number(hostFormTeamId) : null,
        });
        setHosts((prev) => prev.map((h) => h.id === updated.id ? updated : h));
      } else {
        const created = await hostService.createHost(token, {
          email: hostFormEmail,
          password: hostFormPassword,
          ...(hostFormTeamId ? { team_id: Number(hostFormTeamId) } : {}),
        });
        setHosts((prev) => [...prev, created]);
      }
      closeHostModal();
    } catch (err: any) { setHostFormError(err.message); }
    finally { setHostSubmitting(false); }
  };

  const handleDeactivateHost = async (host: Host) => {
    if (!token) return;
    try {
      const updated = await hostService.deactivateHost(token, host.id);
      setHosts((prev) => prev.map((h) => h.id === updated.id ? updated : h));
    } catch (err: any) { setHostsError(err.message); }
    finally { setConfirmDeactivateHost(null); }
  };

  // ---- Emcee handlers ----
  const openAssign = (emcee: Emcee) => { setAssigningEmcee(emcee); setAssignTeamId(''); setAssignError(null); };
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
  const inactiveTeams = teams.filter((t) => !t.active);
  const activeHosts = hosts.filter((h) => h.active);
  const inactiveHosts = hosts.filter((h) => !h.active);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'teams', label: 'Teams' },
    { key: 'hosts', label: 'Hosts' },
    { key: 'emcees', label: 'Emcees' },
    { key: 'sessions', label: 'Sessions' },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800">Admin Panel</h2>
        <p className="mt-1 text-sm text-slate-500">Manage teams, hosts, emcees, and sessions.</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-2 pt-2 gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${activeTab === key ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Teams tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Create, rename, and deactivate teams.</p>
              <button onClick={openCreateTeam} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150">+ New Team</button>
            </div>
            <div className="p-6">
              {teamsLoading && <p className="text-sm text-slate-400">Loading...</p>}
              {teamsError && <p className="text-sm text-red-500">{teamsError}</p>}
              {!teamsLoading && !teamsError && teams.length === 0 && <p className="text-sm text-slate-400">No teams yet.</p>}
              {activeTeams.length > 0 && (
                <ul className="space-y-2">
                  {activeTeams.map((team) => (
                    <li key={team.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{team.name}</p>
                        {team.description && <p className="text-xs text-slate-400 truncate">{team.description}</p>}
                        {team.emcee_email && <p className="text-xs text-teal-600">Emcee: {team.emcee_email}</p>}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{team.host_count} host{team.host_count !== 1 ? 's' : ''}</span>
                      <button onClick={() => openEditTeam(team)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0">Edit</button>
                      <button onClick={() => setConfirmDeactivateTeam(team)} className="text-xs font-medium text-red-500 hover:text-red-700 shrink-0">Deactivate</button>
                    </li>
                  ))}
                </ul>
              )}
              {inactiveTeams.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Inactive</p>
                  <ul className="space-y-2">
                    {inactiveTeams.map((team) => (
                      <li key={team.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 opacity-50">
                        <p className="text-sm font-semibold text-slate-500 line-through flex-1">{team.name}</p>
                        <span className="text-xs text-slate-400">Deactivated</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hosts tab */}
        {activeTab === 'hosts' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Create, edit, and deactivate host accounts.</p>
              <button onClick={openCreateHost} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150">+ New Host</button>
            </div>
            <div className="p-6">
              {hostsLoading && <p className="text-sm text-slate-400">Loading...</p>}
              {hostsError && <p className="text-sm text-red-500">{hostsError}</p>}
              {!hostsLoading && !hostsError && hosts.length === 0 && <p className="text-sm text-slate-400">No hosts yet.</p>}
              {activeHosts.length > 0 && (
                <ul className="space-y-2">
                  {activeHosts.map((host) => (
                    <li key={host.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{host.email}</p>
                        {host.team_name && <p className="text-xs text-slate-400">{host.team_name}</p>}
                      </div>
                      <button onClick={() => openEditHost(host)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0">Edit</button>
                      <button onClick={() => setConfirmDeactivateHost(host)} className="text-xs font-medium text-red-500 hover:text-red-700 shrink-0">Deactivate</button>
                    </li>
                  ))}
                </ul>
              )}
              {inactiveHosts.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Inactive</p>
                  <ul className="space-y-2">
                    {inactiveHosts.map((host) => (
                      <li key={host.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 opacity-50">
                        <p className="text-sm font-semibold text-slate-500 line-through flex-1">{host.email}</p>
                        <span className="text-xs text-slate-400">Deactivated</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emcees tab */}
        {activeTab === 'emcees' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-xs text-slate-400">View emcees and manage their team assignments.</p>
            </div>
            <div className="p-6">
              {emceesLoading && <p className="text-sm text-slate-400">Loading...</p>}
              {emceesError && <p className="text-sm text-red-500">{emceesError}</p>}
              {!emceesLoading && !emceesError && emcees.length === 0 && <p className="text-sm text-slate-400">No emcees found.</p>}
              {emcees.length > 0 && (
                <ul className="space-y-2">
                  {emcees.map((emcee) => (
                    <li key={emcee.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{emcee.email}</p>
                        {emcee.teams.length > 0
                          ? <p className="text-xs text-slate-400">{emcee.teams.map((t) => t.name).join(', ')}</p>
                          : <p className="text-xs text-slate-400">No team assigned</p>}
                      </div>
                      <button onClick={() => openAssign(emcee)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0">Assign Team</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div className="p-6">
            <p className="text-sm text-slate-400">Session management coming soon.</p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Team create / edit modal                                            */}
      {/* ------------------------------------------------------------------ */}
      <Modal open={showTeamModal} onClose={closeTeamModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{editingTeam ? 'Edit Team' : 'New Team'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{editingTeam ? `Updating "${editingTeam.name}"` : 'Add a new team to the roster.'}</p>
          </div>
          <CloseButton onClick={closeTeamModal} />
        </div>
        <form onSubmit={handleTeamSubmit}>
          <div className="px-6 py-5 space-y-3">
            {teamFormError && <FormError message={teamFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team Name</label>
              <input
                type="text"
                placeholder="e.g. Alpha Squad"
                value={teamFormName}
                onChange={(e) => setTeamFormName(e.target.value)}
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
                value={teamFormDesc}
                onChange={(e) => setTeamFormDesc(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeTeamModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={teamSubmitting} label={editingTeam ? 'Save Changes' : 'Create Team'} loadingLabel="Saving…" />
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Host create / edit modal                                            */}
      {/* ------------------------------------------------------------------ */}
      <Modal open={showHostModal} onClose={closeHostModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{editingHost ? 'Edit Host' : 'New Host'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{editingHost ? `Editing ${editingHost.email}` : 'Create a new host account.'}</p>
          </div>
          <CloseButton onClick={closeHostModal} />
        </div>
        <form onSubmit={handleHostSubmit}>
          <div className="px-6 py-5 space-y-3">
            {hostFormError && <FormError message={hostFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="host@example.com"
                value={hostFormEmail}
                onChange={(e) => setHostFormEmail(e.target.value)}
                required
                autoFocus
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
                value={hostFormPassword}
                onChange={(e) => setHostFormPassword(e.target.value)}
                {...(!editingHost ? { required: true } : {})}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team <span className="text-slate-400 font-normal">(optional)</span></label>
              <select
                value={hostFormTeamId}
                onChange={(e) => setHostFormTeamId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">No team assigned</option>
                {activeTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeHostModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={hostSubmitting} label={editingHost ? 'Save Changes' : 'Create Host'} loadingLabel="Saving…" />
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Emcee assign team modal                                             */}
      {/* ------------------------------------------------------------------ */}
      <Modal open={!!assigningEmcee} onClose={closeAssign}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assign Team</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{assigningEmcee?.email}</p>
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

      {/* ------------------------------------------------------------------ */}
      {/* Confirm deactivate team modal                                       */}
      {/* ------------------------------------------------------------------ */}
      <Modal open={!!confirmDeactivateTeam} onClose={() => setConfirmDeactivateTeam(null)} maxWidth="max-w-sm">
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
            Deactivate <span className="font-semibold text-slate-800">"{confirmDeactivateTeam?.name}"</span>? Historical session and coin data will be preserved.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
          <button onClick={() => setConfirmDeactivateTeam(null)} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => confirmDeactivateTeam && handleDeactivateTeam(confirmDeactivateTeam)}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150"
          >
            Deactivate
          </button>
        </div>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Confirm deactivate host modal                                       */}
      {/* ------------------------------------------------------------------ */}
      <Modal open={!!confirmDeactivateHost} onClose={() => setConfirmDeactivateHost(null)} maxWidth="max-w-sm">
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
            Deactivate <span className="font-semibold text-slate-800">"{confirmDeactivateHost?.email}"</span>? All historical coin data will be preserved.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
          <button onClick={() => setConfirmDeactivateHost(null)} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => confirmDeactivateHost && handleDeactivateHost(confirmDeactivateHost)}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150"
          >
            Deactivate
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminDashboard;
