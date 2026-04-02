import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { emceeService } from '../../services/emceeService';
import { sessionService } from '../../services/sessionService';
import { reportService } from '../../services/reportService';
import type { Team } from '../../interfaces/team';
import type { Session } from '../../interfaces/session';
import type { TeamTotalsRow } from '../../interfaces/teamTotals';
import { Modal, FormError, SubmitButton, CloseButton } from '../../components/AdminShared';
import { Users, UserCheck, Mic, Calendar, AlertTriangle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [activeHostCount, setActiveHostCount] = useState(0);
  const [emceeCount, setEmceeCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teamTotals, setTeamTotals] = useState<TeamTotalsRow[]>([]);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  const [showHostModal, setShowHostModal] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [hostTeamId, setHostTeamId] = useState('');
  const [hostFormError, setHostFormError] = useState<string | null>(null);
  const [hostSubmitting, setHostSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const todayStr = now.toISOString().split('T')[0];

    Promise.all([
      teamService.getTeams(token),
      hostService.getHosts(token),
      emceeService.getEmcees(token),
      sessionService.getSessions(token),
      reportService.getTeamTotals(token, startOfMonth, todayStr),
    ])
      .then(([t, h, e, s, totals]) => {
        setTeams(t);
        setActiveHostCount(h.filter((host) => host.active).length);
        setEmceeCount(e.length);
        setSessions(s.sessions);
        setTeamTotals(totals);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const closeTeamModal = useCallback(() => setShowTeamModal(false), []);
  const closeHostModal = useCallback(() => setShowHostModal(false), []);

  const openTeamModal = () => {
    setTeamName(''); setTeamDesc(''); setTeamFormError(null);
    setShowTeamModal(true);
  };

  const openHostModal = () => {
    setHostName(''); setHostEmail(''); setHostPassword(''); setHostTeamId(''); setHostFormError(null);
    setShowHostModal(true);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTeamSubmitting(true); setTeamFormError(null);
    try {
      const created = await teamService.createTeam(token, { name: teamName, description: teamDesc || undefined });
      setTeams((prev) => [...prev, created]);
      closeTeamModal();
    } catch (err: any) { setTeamFormError(err.message); }
    finally { setTeamSubmitting(false); }
  };

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setHostSubmitting(true); setHostFormError(null);
    try {
      await hostService.createHost(token, {
        name: hostName,
        email: hostEmail,
        password: hostPassword,
        ...(hostTeamId ? { team_id: Number(hostTeamId) } : {}),
      });
      closeHostModal();
    } catch (err: any) { setHostFormError(err.message); }
    finally { setHostSubmitting(false); }
  };

  const activeTeams = teams.filter((t) => t.active);
  const teamsWithoutEmcee = activeTeams.filter((t) => t.emcee_id === null);

  const now = new Date();
  const thisMonthSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const topTeams = teamTotals.slice(0, 5);

  const statCards = [
    { label: 'Active Teams', value: activeTeams.length, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Active Hosts', value: activeHostCount, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Emcees', value: emceeCount, icon: Mic, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Sessions This Month', value: thisMonthSessions.length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 font-medium leading-tight">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
        <button
          onClick={openTeamModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
        >
          + New Team
        </button>
        <button
          onClick={openHostModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          + New Host
        </button>
      </div>

      {/* Attention Needed */}
      {teamsWithoutEmcee.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">Attention Needed</p>
          </div>
          <ul className="space-y-1.5">
            {teamsWithoutEmcee.map((team) => (
              <li key={team.id} className="flex items-center gap-2 text-xs text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span><span className="font-semibold">{team.name}</span> has no emcee assigned</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Teams + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Top Teams</h2>
            <p className="text-xs text-slate-400 mt-0.5">By total coins this month</p>
          </div>
          <div className="p-4">
            {topTeams.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No session data this month.</p>
            ) : (
              <ul className="space-y-3">
                {topTeams.map((row, index) => {
                  const maxCoins = topTeams[0].total_coins || 1;
                  const pct = Math.round((row.total_coins / maxCoins) * 100);
                  return (
                    <li key={row.team_id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4 shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{row.team_name}</p>
                          <p className="text-xs font-bold text-teal-600 shrink-0 ml-2">{row.total_coins.toLocaleString()}</p>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Recent Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest across all teams</p>
          </div>
          <div className="p-4">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No sessions yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentSessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.team_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {s.session_slot === 'first' ? 'Slot 1' : 'Slot 2'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {s.host_names.length} host{s.host_names.length !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* New Team Modal */}
      <Modal open={showTeamModal} onClose={closeTeamModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Team</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a new team to the roster.</p>
          </div>
          <CloseButton onClick={closeTeamModal} />
        </div>
        <form onSubmit={handleCreateTeam}>
          <div className="px-6 py-5 space-y-3">
            {teamFormError && <FormError message={teamFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team Name</label>
              <input
                type="text"
                placeholder="e.g. Alpha Squad"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
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
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeTeamModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={teamSubmitting} label="Create Team" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>

      {/* New Host Modal */}
      <Modal open={showHostModal} onClose={closeHostModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Host</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a new host to the system.</p>
          </div>
          <CloseButton onClick={closeHostModal} />
        </div>
        <form onSubmit={handleCreateHost}>
          <div className="px-6 py-5 space-y-3">
            {hostFormError && <FormError message={hostFormError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
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
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Temporary password"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team <span className="text-slate-400 font-normal">(optional)</span></label>
              <select
                value={hostTeamId}
                onChange={(e) => setHostTeamId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">No team</option>
                {activeTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={closeHostModal} className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <SubmitButton loading={hostSubmitting} label="Create Host" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default DashboardPage;
