import type { TeamHostStat } from '../interfaces/teamHostStat';

class TeamHostStatService {
  private baseURL = '/api/v1';

  async getTeamHostStats(
    token: string,
    teamId: number,
    filters?: { date_from?: string; date_to?: string }
  ): Promise<TeamHostStat[]> {
    const url = new URL(`${this.baseURL}/emcee/team_host_stats`, window.location.origin);
    url.searchParams.set('team_id', String(teamId));
    if (filters?.date_from) url.searchParams.set('date_from', filters.date_from);
    if (filters?.date_to) url.searchParams.set('date_to', filters.date_to);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to fetch team host stats with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as TeamHostStat[];
  }
}

export const teamHostStatService = new TeamHostStatService();
