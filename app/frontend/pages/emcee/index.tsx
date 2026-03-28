import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import { teamService } from '../../services/teamService';
import type { Team } from '../../interfaces/team';

const EmceeDashboard: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    teamService
      .getTeams(token)
      .then(setTeams)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Your Assigned Teams</h2>
          <p className="text-xs text-slate-400 mt-0.5">Teams you are responsible for.</p>
        </div>

        <div className="p-6">
          {isLoading && <p className="text-sm text-slate-400">Loading teams...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && teams.length === 0 && (
            <p className="text-sm text-slate-400">You have no teams assigned yet.</p>
          )}
          {!isLoading && !error && teams.length > 0 && (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                  {team.name}
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
