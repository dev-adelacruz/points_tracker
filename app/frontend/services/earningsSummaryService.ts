import type { EarningsSummary } from '../interfaces/earningsSummary';

class EarningsSummaryService {
  private baseURL = '/api/v1';

  async getEarningsSummary(token: string): Promise<EarningsSummary> {
    const response = await fetch(`${this.baseURL}/host/earnings_summary`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to fetch earnings summary with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as EarningsSummary;
  }
}

export const earningsSummaryService = new EarningsSummaryService();
