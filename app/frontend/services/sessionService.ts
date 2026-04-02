import type { Session } from '../interfaces/session';

interface SessionMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

interface SessionsResponse {
  sessions: Session[];
  meta: SessionMeta;
}

interface SessionFilters {
  page?: number;
  per_page?: number;
  team_id?: number;
  date_from?: string;
  date_to?: string;
  session_slot?: 'first' | 'second';
}

class SessionService {
  private baseURL = '/api/v1';

  async getSessions(token: string, filters?: SessionFilters): Promise<SessionsResponse> {
    const query = new URLSearchParams();
    if (filters?.page) query.set('page', String(filters.page));
    if (filters?.per_page) query.set('per_page', String(filters.per_page));
    if (filters?.team_id) query.set('team_id', String(filters.team_id));
    if (filters?.date_from) query.set('date_from', filters.date_from);
    if (filters?.date_to) query.set('date_to', filters.date_to);
    if (filters?.session_slot) query.set('session_slot', filters.session_slot);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${this.baseURL}/sessions${qs}`, {
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
    return { sessions: body.data as Session[], meta: body.meta as SessionMeta };
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
