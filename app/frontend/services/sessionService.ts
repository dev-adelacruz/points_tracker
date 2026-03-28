import type { Session } from '../interfaces/session';

class SessionService {
  private baseURL = '/api/v1';

  async getSessions(token: string): Promise<Session[]> {
    const response = await fetch(`${this.baseURL}/sessions`, {
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
}

export const sessionService = new SessionService();
