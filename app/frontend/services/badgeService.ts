import type { BadgesResponse } from '../interfaces/badge';

class BadgeService {
  private baseURL = '/api/v1';

  async getBadges(token: string): Promise<BadgesResponse> {
    const response = await fetch(`${this.baseURL}/host/badges`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to fetch badges with status ${response.status}`);
    }

    return response.json();
  }
}

export const badgeService = new BadgeService();
