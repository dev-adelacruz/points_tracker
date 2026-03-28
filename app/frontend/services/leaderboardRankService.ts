import type { LeaderboardRank } from '../interfaces/leaderboardRank';

class LeaderboardRankService {
  private baseURL = '/api/v1';

  async getLeaderboardRank(token: string): Promise<LeaderboardRank> {
    const response = await fetch(`${this.baseURL}/host/leaderboard_rank`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to fetch leaderboard rank with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as LeaderboardRank;
  }
}

export const leaderboardRankService = new LeaderboardRankService();
