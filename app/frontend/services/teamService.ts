import type { Team } from '../interfaces/team';

class TeamService {
  private baseURL = '/api/v1';

  async getTeams(token: string): Promise<Team[]> {
    const response = await fetch(`${this.baseURL}/teams`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch teams with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Team[];
  }
}

export const teamService = new TeamService();
