import type { Session } from '../interfaces/session';

class SessionService {
  private baseURL = '/api/v1';

  async getSessions(
    token: string,
    filters?: { team_id?: number; emcee_id?: number; date_from?: string; date_to?: string }
  ): Promise<Session[]> {
    const url = new URL(`${this.baseURL}/sessions`, window.location.origin);
    if (filters?.team_id) url.searchParams.set('team_id', String(filters.team_id));
    if (filters?.emcee_id) url.searchParams.set('emcee_id', String(filters.emcee_id));
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
      throw new Error(errorData.message || `Failed to fetch sessions with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Session[];
  }

  async createSession(
    token: string,
    params: { date: string; session_slot: 'first' | 'second'; team_id: number; host_ids?: number[] }
  ): Promise<Session> {
    const { host_ids, ...sessionParams } = params;
    const response = await fetch(`${this.baseURL}/sessions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session: sessionParams, host_ids: host_ids ?? [] }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to create session with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Session;
  }

  async updateSession(
    token: string,
    id: number,
    params: { date?: string; session_slot?: 'first' | 'second'; host_ids?: number[] }
  ): Promise<Session> {
    const { host_ids, ...sessionParams } = params;
    const response = await fetch(`${this.baseURL}/sessions/${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session: sessionParams, host_ids }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to update session with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Session;
  }

  async deleteSession(token: string, id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/sessions/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to delete session with status ${response.status}`);
    }
  }
}

export const sessionService = new SessionService();
