import type { HostCoinHistoryEntry } from '../interfaces/hostCoinHistory';

class HostCoinHistoryService {
  private baseURL = '/api/v1';

  async getCoinHistory(
    token: string,
    filters?: { date_from?: string; date_to?: string }
  ): Promise<HostCoinHistoryEntry[]> {
    const url = new URL(`${this.baseURL}/host/coin_history`, window.location.origin);
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
      throw new Error(errorData.status?.message || `Failed to fetch coin history with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as HostCoinHistoryEntry[];
  }
}

export const hostCoinHistoryService = new HostCoinHistoryService();
