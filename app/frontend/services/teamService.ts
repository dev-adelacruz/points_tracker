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

  async createTeam(token: string, params: { name: string; description?: string }): Promise<Team> {
    const response = await fetch(`${this.baseURL}/teams`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team: params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to create team with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Team;
  }

  async updateTeam(token: string, id: number, params: { name?: string; description?: string }): Promise<Team> {
    const response = await fetch(`${this.baseURL}/teams/${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team: params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to update team with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Team;
  }

  async deactivateTeam(token: string, id: number): Promise<Team> {
    const response = await fetch(`${this.baseURL}/teams/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to deactivate team with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Team;
  }
}

export const teamService = new TeamService();
