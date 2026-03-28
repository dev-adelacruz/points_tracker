import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
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
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Emcee Dashboard</h1>
      <p className="mt-2 text-slate-500">Your assigned teams.</p>

      <div className="mt-6">
        {isLoading && <p className="text-slate-400">Loading teams...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && teams.length === 0 && (
          <p className="text-slate-400">You have no teams assigned yet.</p>
        )}
        {!isLoading && !error && teams.length > 0 && (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm"
              >
                {team.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmceeDashboard;
