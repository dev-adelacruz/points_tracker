import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import { sessionService } from '../../services/sessionService';
import { coinEntryService } from '../../services/coinEntryService';
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

  const [showModal, setShowModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formSlot, setFormSlot] = useState<'first' | 'second'>('first');
  const [formTeamId, setFormTeamId] = useState('');
  const [formHostIds, setFormHostIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCoinModal, setShowCoinModal] = useState(false);
  const [isCoinModalVisible, setIsCoinModalVisible] = useState(false);
  const [coinSession, setCoinSession] = useState<Session | null>(null);
  const [coinValues, setCoinValues] = useState<Record<number, string>>({});
  const [coinError, setCoinError] = useState<string | null>(null);
  const [isCoinSubmitting, setIsCoinSubmitting] = useState(false);

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

  const openModal = () => {
    setShowModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsModalVisible(true));
    });
  };

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setFormDate('');
      setFormSlot('first');
      setFormTeamId('');
      setFormHostIds([]);
      setFormError(null);
    }, 220);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showModal, closeModal]);

  const openCoinModal = useCallback((session: Session) => {
    const initial: Record<number, string> = {};
    session.host_ids.forEach((id) => { initial[id] = '0'; });
    setCoinSession(session);
    setCoinValues(initial);
    setCoinError(null);
    setShowCoinModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsCoinModalVisible(true));
    });
  }, []);

  const closeCoinModal = useCallback(() => {
    setIsCoinModalVisible(false);
    setTimeout(() => {
      setShowCoinModal(false);
      setCoinSession(null);
      setCoinValues({});
      setCoinError(null);
    }, 220);
  }, []);

  useEffect(() => {
    if (!showCoinModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCoinModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showCoinModal, closeCoinModal]);

  const handleCoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !coinSession) return;

    setIsCoinSubmitting(true);
    setCoinError(null);

    try {
      const entries = Object.entries(coinValues).map(([uid, coins]) => ({
        user_id: Number(uid),
        coins: Number(coins),
      }));
      await coinEntryService.saveCoinEntries(token, coinSession.id, entries);
      closeCoinModal();
    } catch (err: any) {
      setCoinError(err.message);
      setIsCoinSubmitting(false);
    }
  };

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
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
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
            <ul className="space-y-3">
              {teams.map((team) => (
                <li key={team.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    {team.name}
                    <span className="ml-auto text-xs text-slate-400">{team.host_count} host{team.host_count !== 1 ? 's' : ''}</span>
                  </div>
                  {team.members.length > 0 ? (
                    <ul className="border-t border-slate-100 divide-y divide-slate-100">
                      {team.members.map((member) => (
                        <li key={member.id} className="flex items-center gap-2 px-4 py-2">
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 uppercase">
                            {member.email.charAt(0)}
                          </span>
                          <span className="text-xs text-slate-600 truncate">{member.email}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">No hosts assigned.</p>
                  )}
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
            onClick={openModal}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
          >
            + New Session
          </button>
        </div>

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
                  {session.host_ids.length > 0 && (
                    <button
                      onClick={() => openCoinModal(session)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all duration-150 shrink-0"
                    >
                      Log Coins
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeModal}
          />

          {/* Modal card */}
          <div
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ${isModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">New Session</h2>
                <p className="text-xs text-slate-400 mt-0.5">Record a live session for coin entry.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-red-600">{formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      max={today}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Slot</label>
                    <select
                      value={formSlot}
                      onChange={(e) => setFormSlot(e.target.value as 'first' | 'second')}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    >
                      <option value="first">1st Session</option>
                      <option value="second">2nd Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Team</label>
                  <select
                    value={formTeamId}
                    onChange={(e) => setFormTeamId(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select team</option>
                    {teams.filter((t) => t.active).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {hosts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Participating Hosts
                      {formHostIds.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700">
                          {formHostIds.length} selected
                        </span>
                      )}
                    </label>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                      {hosts.map((host) => (
                        <label
                          key={host.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${formHostIds.includes(host.id) ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={formHostIds.includes(host.id)}
                            onChange={() => toggleHost(host.id)}
                            className="rounded accent-teal-600"
                          />
                          <span className="text-sm text-slate-700 truncate flex-1">{host.email}</span>
                          {host.team_name && (
                            <span className="text-xs text-slate-400 shrink-0">{host.team_name}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 min-w-[100px] text-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </span>
                  ) : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Coin Entry Modal */}
      {showCoinModal && coinSession && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isCoinModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${isCoinModalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeCoinModal}
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ${isCoinModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Log Coins</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {coinSession.date} — {coinSession.session_slot === 'first' ? '1st' : '2nd'} Session · {coinSession.team_name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCoinModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCoinSubmit}>
              <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
                {coinError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-red-600">{coinError}</p>
                  </div>
                )}
                {coinSession.host_ids.map((hostId, idx) => (
                  <div key={hostId} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 flex-1 truncate">{coinSession.host_emails[idx] ?? `Host #${hostId}`}</span>
                    <input
                      type="number"
                      min="0"
                      value={coinValues[hostId] ?? '0'}
                      onChange={(e) => setCoinValues((prev) => ({ ...prev, [hostId]: e.target.value }))}
                      className="w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCoinModal}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCoinSubmitting}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 min-w-[100px] text-center"
                >
                  {isCoinSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving…
                    </span>
                  ) : 'Save Entries'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmceeDashboard;
