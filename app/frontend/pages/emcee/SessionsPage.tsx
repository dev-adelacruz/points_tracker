import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Calendar } from 'lucide-react';
import { RootState } from '../../state/store';
import { sessionService } from '../../services/sessionService';
import { coinEntryService } from '../../services/coinEntryService';
import { teamService } from '../../services/teamService';
import { hostService } from '../../services/hostService';
import type { Session } from '../../interfaces/session';
import type { Team } from '../../interfaces/team';
import type { Host } from '../../interfaces/host';
import { Modal, FormError, SubmitButton, CloseButton } from '../../components/AdminShared';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZE = 15;

const EmceeSessionsPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const { showToast } = useToast();
  const prevCoinEntriesRef = useRef<{ user_id: number; coins: number }[] | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSlot, setFilterSlot] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formSlot, setFormSlot] = useState<'first' | 'second'>('first');
  const [formTeamId, setFormTeamId] = useState('');
  const [formHostIds, setFormHostIds] = useState<number[]>([]);
  const [teamHosts, setTeamHosts] = useState<Host[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Coin entries modal
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [coinsForm, setCoinsForm] = useState<Record<number, string>>({});
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [savingCoins, setSavingCoins] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);

  const fetchSessions = useCallback(
    async (page: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await sessionService.getSessions(token, {
          page,
          per_page: PAGE_SIZE,
          ...(filterTeamId ? { team_id: Number(filterTeamId) } : {}),
          ...(filterDateFrom ? { date_from: filterDateFrom } : {}),
          ...(filterDateTo ? { date_to: filterDateTo } : {}),
          ...(filterSlot ? { session_slot: filterSlot as 'first' | 'second' } : {}),
        });
        setSessions(result.sessions);
        setTotalPages(result.meta.total_pages);
        setCurrentPage(result.meta.page);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [token, filterTeamId, filterDateFrom, filterDateTo, filterSlot],
  );

  useEffect(() => {
    if (!token) return;
    teamService.getTeams(token).then(setTeams).catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchSessions(1);
  }, [fetchSessions]);

  useEffect(() => {
    if (!formTeamId || !token) {
      setTeamHosts([]);
      return;
    }
    hostService
      .getHosts(token, { team_id: Number(formTeamId), active: true })
      .then(setTeamHosts)
      .catch(() => {});
    setFormHostIds([]);
  }, [formTeamId, token]);

  const openCreateModal = () => {
    setFormDate('');
    setFormSlot('first');
    setFormTeamId('');
    setFormHostIds([]);
    setTeamHosts([]);
    setFormError(null);
    setShowCreateModal(true);
  };
  const closeCreateModal = useCallback(() => setShowCreateModal(false), []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await sessionService.createSession(token, {
        date: formDate,
        session_slot: formSlot,
        team_id: Number(formTeamId),
        host_ids: formHostIds,
      });
      closeCreateModal();
      fetchSessions(1);
      showToast({ message: 'Session created.', variant: 'success' });
    } catch (err: any) {
      setFormError(err.message);
      showToast({ message: err.message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHostId = (id: number) => {
    setFormHostIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const openCoinModal = async (session: Session) => {
    if (!token) return;
    setSelectedSession(session);
    setCoinError(null);
    setCoinsForm({});
    setLoadingEntries(true);
    prevCoinEntriesRef.current = null;
    try {
      const entries = await coinEntryService.getCoinEntries(token, session.id);
      const form: Record<number, string> = {};
      session.host_ids.forEach((hid) => {
        const entry = entries.find((e) => e.user_id === hid);
        form[hid] = entry ? String(entry.coins) : '0';
      });
      setCoinsForm(form);
      prevCoinEntriesRef.current = session.host_ids.map((hid) => {
        const entry = entries.find((e) => e.user_id === hid);
        return { user_id: hid, coins: entry ? entry.coins : 0 };
      });
    } catch (e: any) {
      setCoinError(e.message);
    } finally {
      setLoadingEntries(false);
    }
  };
  const closeCoinModal = useCallback(() => setSelectedSession(null), []);

  const handleSaveCoins = async () => {
    if (!token || !selectedSession) return;
    setSavingCoins(true);
    setCoinError(null);
    const snapshot = prevCoinEntriesRef.current;
    const sessionId = selectedSession.id;
    const hostCount = selectedSession.host_ids.length;
    try {
      const entries = selectedSession.host_ids.map((hid) => ({
        user_id: hid,
        coins: Number(coinsForm[hid] ?? 0),
      }));
      const saved = await coinEntryService.saveCoinEntries(token, sessionId, entries);
      const total = saved.reduce((sum, e) => sum + e.coins, 0);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, coin_total: total } : s)),
      );
      closeCoinModal();
      showToast({
        message: `Coins saved for ${hostCount} host${hostCount !== 1 ? 's' : ''}.`,
        variant: 'success',
        duration: 5000,
        undoLabel: 'Undo',
        undoDuration: 5000,
        onUndo: snapshot
          ? async () => {
              try {
                await coinEntryService.saveCoinEntries(token, sessionId, snapshot);
                const restoredTotal = snapshot.reduce((sum, e) => sum + e.coins, 0);
                setSessions((prev) =>
                  prev.map((s) => (s.id === sessionId ? { ...s, coin_total: restoredTotal } : s)),
                );
                showToast({ message: 'Coin entries restored.', variant: 'success' });
              } catch {
                showToast({ message: 'Failed to undo. Please try again.', variant: 'error' });
              }
            }
          : undefined,
      });
    } catch (e: any) {
      setCoinError(e.message);
      showToast({ message: e.message, variant: 'error' });
    } finally {
      setSavingCoins(false);
    }
  };

  const getSessionStatus = (session: Session): 'logged' | 'pending' | null => {
    if (session.host_ids.length === 0) return null;
    return session.coin_total > 0 ? 'logged' : 'pending';
  };

  const activeTeams = teams.filter((t) => t.active);

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">My Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage sessions for your assigned teams.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="text-xs font-semibold px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 min-h-12 sm:min-h-0"
          >
            + New Session
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-auto"
          >
            <option value="">All Teams</option>
            {activeTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-auto"
            placeholder="From"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-auto"
            placeholder="To"
          />
          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-3 sm:py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-auto"
          >
            <option value="">All Slots</option>
            <option value="first">First Slot</option>
            <option value="second">Second Slot</option>
          </select>
        </div>

        <div className="p-6">
          {loading && <p className="text-sm text-slate-400">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!loading && !error && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">No sessions yet</h3>
              <p className="text-xs text-slate-400 mb-4">
                Sessions for your assigned teams will appear here.
              </p>
              <button
                onClick={openCreateModal}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
              >
                + Create your first session
              </button>
            </div>
          )}

          {sessions.length > 0 && (
            <>
              <ul className="space-y-2">
                {sessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <li
                      key={session.id}
                      onClick={() => openCoinModal(session)}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {session.date} ·{' '}
                          {session.session_slot === 'first' ? 'First' : 'Second'} Slot
                        </p>
                        <p className="text-xs text-slate-400">{session.team_name}</p>
                        {session.host_names.length > 0 && (
                          <p className="text-xs text-slate-500 truncate">
                            {session.host_names.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {status === 'logged' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                            Logged
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            Pending
                          </span>
                        )}
                        {session.coin_total > 0 && (
                          <span className="text-xs text-slate-400">
                            {session.coin_total.toLocaleString()} coins
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={fetchSessions}
              />
            </>
          )}
        </div>
      </div>

      {/* Create session modal */}
      <Modal open={showCreateModal} onClose={closeCreateModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">Schedule a new session for your team.</p>
          </div>
          <CloseButton onClick={closeCreateModal} />
        </div>
        <form onSubmit={handleCreateSession}>
          <div className="px-6 py-5 space-y-3">
            {formError && <FormError message={formError} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Slot</label>
              <select
                value={formSlot}
                onChange={(e) => setFormSlot(e.target.value as 'first' | 'second')}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="first">First Slot</option>
                <option value="second">Second Slot</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Team</label>
              <select
                value={formTeamId}
                onChange={(e) => setFormTeamId(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              >
                <option value="">Select a team</option>
                {activeTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {formTeamId && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Hosts <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                {teamHosts.length === 0 ? (
                  <p className="text-xs text-slate-400">No active hosts in this team.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {teamHosts.map((h) => (
                      <label key={h.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formHostIds.includes(h.id)}
                          onChange={() => toggleHostId(h.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-slate-700">{h.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button
              type="button"
              onClick={closeCreateModal}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <SubmitButton loading={submitting} label="Create Session" loadingLabel="Creating…" />
          </div>
        </form>
      </Modal>

      {/* Coin entries modal */}
      <Modal open={!!selectedSession} onClose={closeCoinModal} maxWidth="max-w-lg">
        {selectedSession && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {selectedSession.date} ·{' '}
                  {selectedSession.session_slot === 'first' ? 'First' : 'Second'} Slot
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedSession.team_name}</p>
              </div>
              <CloseButton onClick={closeCoinModal} />
            </div>
            <div className="px-6 py-5">
              {coinError && <FormError message={coinError} />}
              {loadingEntries && <p className="text-sm text-slate-400">Loading entries...</p>}
              {!loadingEntries && selectedSession.host_ids.length === 0 && (
                <p className="text-sm text-slate-400">No hosts assigned to this session.</p>
              )}
              {!loadingEntries && selectedSession.host_ids.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 mb-3">Log coins per host</p>
                  {selectedSession.host_ids.map((hid, idx) => {
                    const name = selectedSession.host_names[idx] ?? `Host ${hid}`;
                    return (
                      <div key={hid} className="flex items-center gap-3">
                        <span className="text-sm text-slate-700 flex-1 truncate">{name}</span>
                        <input
                          type="number"
                          min="0"
                          value={coinsForm[hid] ?? '0'}
                          onChange={(e) =>
                            setCoinsForm((prev) => ({ ...prev, [hid]: e.target.value }))
                          }
                          className="w-28 text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                        />
                        <span className="text-xs text-slate-400">coins</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {!loadingEntries && selectedSession.host_ids.length > 0 && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCoinModal}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCoins}
                  disabled={savingCoins}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 min-w-[110px] text-center"
                >
                  {savingCoins ? 'Saving…' : 'Save Coins'}
                </button>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default EmceeSessionsPage;
