import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { teamService } from '../../services/teamService';
import type { Team } from '../../interfaces/team';

const AdminDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Team | null>(null);

  useEffect(() => {
    if (!token) return;

    teamService
      .getTeams(token)
      .then(setTeams)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditingTeam(null);
    setFormName('');
    setFormDescription('');
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setFormName(team.name);
    setFormDescription(team.description ?? '');
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTeam(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingTeam) {
        const updated = await teamService.updateTeam(token, editingTeam.id, {
          name: formName,
          description: formDescription || undefined,
        });
        setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await teamService.createTeam(token, {
          name: formName,
          description: formDescription || undefined,
        });
        setTeams((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (team: Team) => {
    if (!token) return;

    try {
      const updated = await teamService.deactivateTeam(token, team.id);
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirmDeactivate(null);
    }
  };

  const activeTeams = teams.filter((t) => t.active);
  const inactiveTeams = teams.filter((t) => !t.active);

  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Company-wide overview.</p>
      </div>

      {/* Team Management */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Team Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create, rename, and deactivate teams.</p>
          </div>
          <button
            onClick={openCreate}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            + New Team
          </button>
        </div>

        {/* Inline form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-700 mb-3">
              {editingTeam ? `Edit "${editingTeam.name}"` : 'New Team'}
            </p>
            {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Team name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : editingTeam ? 'Save Changes' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="p-6">
          {isLoading && <p className="text-sm text-slate-400">Loading teams...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!isLoading && !error && teams.length === 0 && (
            <p className="text-sm text-slate-400">No teams yet. Create one above.</p>
          )}

          {!isLoading && !error && activeTeams.length > 0 && (
            <ul className="space-y-2">
              {activeTeams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{team.name}</p>
                    {team.description && (
                      <p className="text-xs text-slate-400 truncate">{team.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{team.host_count} host{team.host_count !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => openEdit(team)}
                    className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors shrink-0"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setConfirmDeactivate(team)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors shrink-0"
                  >
                    Deactivate
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && !error && inactiveTeams.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Inactive</p>
              <ul className="space-y-2">
                {inactiveTeams.map((team) => (
                  <li
                    key={team.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 opacity-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-500 truncate line-through">{team.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">Deactivated</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Deactivate confirmation modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold text-slate-900">Deactivate Team</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to deactivate <span className="font-semibold text-slate-700">"{confirmDeactivate.name}"</span>? Historical data will be preserved.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleDeactivate(confirmDeactivate)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
