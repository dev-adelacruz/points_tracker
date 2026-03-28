import type { TeamSession } from '../interfaces/teamSession';

class TeamSessionService {
  private baseURL = '/api/v1';

  async getTeamSessions(
    token: string,
    filters?: { date_from?: string; date_to?: string }
  ): Promise<TeamSession[]> {
    const url = new URL(`${this.baseURL}/emcee/team_sessions`, window.location.origin);
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
      throw new Error(errorData.status?.message || `Failed to fetch team sessions with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as TeamSession[];
  }
}

export const teamSessionService = new TeamSessionService();
