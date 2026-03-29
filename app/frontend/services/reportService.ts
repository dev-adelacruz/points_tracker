import type { TeamTotalsRow } from '../interfaces/teamTotals';

class ReportService {
  private baseURL = '/api/v1/reports';

  async getTeamTotals(
    token: string,
    startDate: string,
    endDate: string,
  ): Promise<TeamTotalsRow[]> {
    const query = new URLSearchParams({ start_date: startDate, end_date: endDate });

    const response = await fetch(`${this.baseURL}/team_totals?${query}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.status?.message ||
          `Failed to fetch team totals with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as TeamTotalsRow[];
  }
}

export const reportService = new ReportService();
