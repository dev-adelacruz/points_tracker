import type { CoinEntry } from '../interfaces/coinEntry';

class CoinEntryService {
  private baseURL = '/api/v1';

  async getCoinEntries(token: string, sessionId: number): Promise<CoinEntry[]> {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/coin_entries`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch coin entries with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as CoinEntry[];
  }

  async getPreviousSessionEntries(
    token: string,
    sessionId: number
  ): Promise<{ hasPrevious: boolean; entries: CoinEntry[] }> {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/coin_entries/previous_session`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch previous session entries with status ${response.status}`);
    }

    const body = await response.json();
    return { hasPrevious: body.has_previous as boolean, entries: body.data as CoinEntry[] };
  }

  async saveCoinEntries(
    token: string,
    sessionId: number,
    entries: { user_id: number; coins: number }[]
  ): Promise<CoinEntry[]> {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/coin_entries`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to save coin entries with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as CoinEntry[];
  }
}

export const coinEntryService = new CoinEntryService();
