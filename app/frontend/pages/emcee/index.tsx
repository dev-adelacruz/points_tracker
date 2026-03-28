import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { sessionService } from '../../services/sessionService';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import type { Session } from '../../interfaces/session';

const EmceeDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);

  const [teams, setTeams] = useState<Team[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formSlot, setFormSlot] = useState<'first' | 'second'>('first');
  const [formTeamId, setFormTeamId] = useState('');
  const [formHostIds, setFormHostIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!token) return;

    Promise.all([
      teamService.getTeams(token),
      hostService.getHosts(token, { active: true }),
      sessionService.getSessions(token),
    ])
      .then(([t, h, s]) => { setTeams(t); setHosts(h); setSessions(s); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const toggleHost = (id: number) => {
    setFormHostIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formTeamId) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const created = await sessionService.createSession(token, {
        date: formDate,
        session_slot: formSlot,
        team_id: Number(formTeamId),
        host_ids: formHostIds,
      });
      setSessions((prev) => [created, ...prev]);
      setShowForm(false);
      setFormDate('');
      setFormSlot('first');
      setFormTeamId('');
      setFormHostIds([]);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Assigned Teams */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Your Assigned Teams</h2>
          <p className="text-xs text-slate-400 mt-0.5">Teams you are responsible for.</p>
        </div>
        <div className="p-6">
          {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && teams.length === 0 && (
            <p className="text-sm text-slate-400">You have no teams assigned yet.</p>
          )}
          {!isLoading && !error && teams.length > 0 && (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li key={team.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                  {team.name}
                  <span className="ml-auto text-xs text-slate-400">{team.host_count} host{team.host_count !== 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Live Sessions */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Live Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create and review session records for coin entry.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Session'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-700 mb-3">New Session</p>
            {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    max={today}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Slot</label>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value as 'first' | 'second')}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="first">1st Session</option>
                    <option value="second">2nd Session</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Primary Team</label>
                <select
                  value={formTeamId}
                  onChange={(e) => setFormTeamId(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select team</option>
                  {teams.filter((t) => t.active).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {hosts.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Participating Hosts</label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                    {hosts.map((host) => (
                      <label key={host.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={formHostIds.includes(host.id)}
                          onChange={() => toggleHost(host.id)}
                          className="rounded"
                        />
                        <span className="truncate">{host.email}</span>
                        {host.team_name && <span className="text-xs text-slate-400 ml-auto shrink-0">{host.team_name}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="p-6">
          {!isLoading && sessions.length === 0 && (
            <p className="text-sm text-slate-400">No sessions recorded yet.</p>
          )}
          {sessions.length > 0 && (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {session.date} — {session.session_slot === 'first' ? '1st' : '2nd'} Session
                    </p>
                    <p className="text-xs text-slate-400">{session.team_name} · {session.host_emails.length} host{session.host_emails.length !== 1 ? 's' : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmceeDashboard;
