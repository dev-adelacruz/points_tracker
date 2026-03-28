import type { LeaderboardPage } from '../interfaces/leaderboard';

class LeaderboardService {
  private baseURL = '/api/v1';

  async getLeaderboard(
    token: string,
    params?: { date_from?: string; date_to?: string; page?: number; per_page?: number }
  ): Promise<LeaderboardPage> {
    const url = new URL(`${this.baseURL}/leaderboard`, window.location.origin);
    if (params?.date_from) url.searchParams.set('date_from', params.date_from);
    if (params?.date_to) url.searchParams.set('date_to', params.date_to);
    if (params?.page) url.searchParams.set('page', String(params.page));
    if (params?.per_page) url.searchParams.set('per_page', String(params.per_page));

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
      throw new Error(errorData.status?.message || `Failed to fetch leaderboard with status ${response.status}`);
    }

    const body = await response.json();
    return { data: body.data, meta: body.meta } as LeaderboardPage;
  }
}

export const leaderboardService = new LeaderboardService();
