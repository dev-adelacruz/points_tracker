import React, { useEffect, useState } from 'react';
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

const AdminDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const [activeTab, setActiveTab] = useState<Tab>('teams');

  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
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
  const [showHostForm, setShowHostForm] = useState(false);
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

  // Team handlers
  const openCreateTeam = () => { setEditingTeam(null); setTeamFormName(''); setTeamFormDesc(''); setTeamFormError(null); setShowTeamForm(true); };
  const openEditTeam = (t: Team) => { setEditingTeam(t); setTeamFormName(t.name); setTeamFormDesc(t.description ?? ''); setTeamFormError(null); setShowTeamForm(true); };
  const closeTeamForm = () => { setShowTeamForm(false); setEditingTeam(null); setTeamFormError(null); };

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
      closeTeamForm();
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

  // Host handlers
  const openCreateHost = () => { setEditingHost(null); setHostFormEmail(''); setHostFormPassword(''); setHostFormTeamId(''); setHostFormError(null); setShowHostForm(true); };
  const openEditHost = (h: Host) => { setEditingHost(h); setHostFormEmail(h.email); setHostFormPassword(''); setHostFormTeamId(h.team_id ? String(h.team_id) : ''); setHostFormError(null); setShowHostForm(true); };
  const closeHostForm = () => { setShowHostForm(false); setEditingHost(null); setHostFormError(null); };

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
      closeHostForm();
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

  // Emcee handlers
  const openAssign = (emcee: Emcee) => { setAssigningEmcee(emcee); setAssignTeamId(''); setAssignError(null); };
  const closeAssign = () => { setAssigningEmcee(null); setAssignError(null); };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !assigningEmcee || !assignTeamId) return;
    setAssignSubmitting(true); setAssignError(null);
    try {
      await teamService.assignEmcee(token, Number(assignTeamId), assigningEmcee.id);
      const updated = await teamService.getTeams(token);
      setTeams(updated);
      const updatedEmcees = await emceeService.getEmcees(token);
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
              <button onClick={openCreateTeam} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors">+ New Team</button>
            </div>
            {showTeamForm && (
              <form onSubmit={handleTeamSubmit} className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-3">{editingTeam ? `Edit "${editingTeam.name}"` : 'New Team'}</p>
                {teamFormError && <p className="text-xs text-red-500 mb-2">{teamFormError}</p>}
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Team name" value={teamFormName} onChange={(e) => setTeamFormName(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <input type="text" placeholder="Description (optional)" value={teamFormDesc} onChange={(e) => setTeamFormDesc(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="submit" disabled={teamSubmitting} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">{teamSubmitting ? 'Saving...' : editingTeam ? 'Save Changes' : 'Create Team'}</button>
                  <button type="button" onClick={closeTeamForm} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
                </div>
              </form>
            )}
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
                      <button onClick={() => openEditTeam(team)} className="text-xs font-medium text-teal-600 hover:text-teal-800 shrink-0">Rename</button>
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
              <button onClick={openCreateHost} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700">+ New Host</button>
            </div>
            {showHostForm && (
              <form onSubmit={handleHostSubmit} className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-3">{editingHost ? `Edit "${editingHost.email}"` : 'New Host'}</p>
                {hostFormError && <p className="text-xs text-red-500 mb-2">{hostFormError}</p>}
                <div className="flex flex-col gap-2">
                  <input type="email" placeholder="Email" value={hostFormEmail} onChange={(e) => setHostFormEmail(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <input type="password" placeholder={editingHost ? 'New password (leave blank to keep)' : 'Password'} value={hostFormPassword} onChange={(e) => setHostFormPassword(e.target.value)} {...(!editingHost ? { required: true } : {})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <select value={hostFormTeamId} onChange={(e) => setHostFormTeamId(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">No team assigned</option>
                    {activeTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="submit" disabled={hostSubmitting} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">{hostSubmitting ? 'Saving...' : editingHost ? 'Save Changes' : 'Create Host'}</button>
                  <button type="button" onClick={closeHostForm} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
                </div>
              </form>
            )}
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
            {assigningEmcee && (
              <form onSubmit={handleAssignSubmit} className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-3">Assign "{assigningEmcee.email}" to a team</p>
                {assignError && <p className="text-xs text-red-500 mb-2">{assignError}</p>}
                <select value={assignTeamId} onChange={(e) => setAssignTeamId(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select a team</option>
                  {activeTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="flex gap-2 mt-3">
                  <button type="submit" disabled={assignSubmitting} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">{assignSubmitting ? 'Assigning...' : 'Assign'}</button>
                  <button type="button" onClick={closeAssign} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
                </div>
              </form>
            )}
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

      {/* Confirm deactivate team modal */}
      {confirmDeactivateTeam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold text-slate-900">Deactivate Team</h3>
            <p className="text-sm text-slate-500 mt-2">Deactivate <span className="font-semibold text-slate-700">"{confirmDeactivateTeam.name}"</span>? Historical data will be preserved.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleDeactivateTeam(confirmDeactivateTeam)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">Deactivate</button>
              <button onClick={() => setConfirmDeactivateTeam(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm deactivate host modal */}
      {confirmDeactivateHost && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold text-slate-900">Deactivate Host</h3>
            <p className="text-sm text-slate-500 mt-2">Deactivate <span className="font-semibold text-slate-700">"{confirmDeactivateHost.email}"</span>? All historical coin data will be preserved.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleDeactivateHost(confirmDeactivateHost)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">Deactivate</button>
              <button onClick={() => setConfirmDeactivateHost(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
