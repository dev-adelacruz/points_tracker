import type { TeamHostStat } from '../interfaces/teamHostStat';

class TeamHostStatService {
  private baseURL = '/api/v1/emcee';

  async getTeamHostStats(
    token: string,
    teamId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<TeamHostStat[]> {
    const query = new URLSearchParams({
      team_id: String(teamId),
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await fetch(`${this.baseURL}/team_host_stats?${query}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.status?.message ||
          `Failed to fetch team host stats with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as TeamHostStat[];
  }
}

export const teamHostStatService = new TeamHostStatService();
