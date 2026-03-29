import type { PeriodComparisonRow, PeriodComparisonParams } from '../interfaces/periodComparison';

class ReportService {
  private baseURL = '/api/v1/reports';

  async getPeriodComparison(
    token: string,
    params: PeriodComparisonParams,
  ): Promise<PeriodComparisonRow[]> {
    const query = new URLSearchParams({
      period_a_start: params.period_a_start,
      period_a_end: params.period_a_end,
      period_b_start: params.period_b_start,
      period_b_end: params.period_b_end,
    });

    if (params.scope) query.set('scope', params.scope);
    if (params.scope_id != null) query.set('scope_id', String(params.scope_id));

    const response = await fetch(`${this.baseURL}/period_comparison?${query}`, {
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
          `Failed to fetch period comparison with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as PeriodComparisonRow[];
  }
}

export const reportService = new ReportService();
