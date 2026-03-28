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

  async assignEmcee(token: string, teamId: number, userId: number): Promise<{ team_id: number; emcee_id: number; emcee_email: string }> {
    const response = await fetch(`${this.baseURL}/teams/${teamId}/emcee_assignment`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to assign emcee with status ${response.status}`);
    }

    const body = await response.json();
    return body.data;
  }

  async unassignEmcee(token: string, teamId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/teams/${teamId}/emcee_assignment`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to unassign emcee with status ${response.status}`);
    }
  }
}

export const teamService = new TeamService();
