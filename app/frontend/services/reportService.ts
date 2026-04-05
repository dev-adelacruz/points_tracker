import type { PeriodComparisonRow, PeriodComparisonParams } from '../interfaces/periodComparison';
import type { TeamTotalsRow } from '../interfaces/teamTotals';
import type { HostPerformanceReport } from '../interfaces/hostPerformance';
import type { EmceePerformanceRow } from '../interfaces/emceePerformance';

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

  async getHostPerformance(
    token: string,
    hostId: number,
    startDate: string,
    endDate: string,
  ): Promise<HostPerformanceReport> {
    const query = new URLSearchParams({
      host_id: String(hostId),
      start_date: startDate,
      end_date: endDate,
    });

    const response = await fetch(`${this.baseURL}/host_performance?${query}`, {
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
          `Failed to fetch host performance with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as HostPerformanceReport;
  }

  async getEmceePerformance(
    token: string,
    startDate: string,
    endDate: string,
  ): Promise<EmceePerformanceRow[]> {
    const query = new URLSearchParams({ start_date: startDate, end_date: endDate });

    const response = await fetch(`${this.baseURL}/emcee_performance?${query}`, {
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
          `Failed to fetch emcee performance with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as EmceePerformanceRow[];
  }
}

export const reportService = new ReportService();
