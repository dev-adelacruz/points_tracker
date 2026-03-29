import type { HostPerformanceReport } from '../interfaces/hostPerformance';

class ReportService {
  private baseURL = '/api/v1/reports';

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
}

export const reportService = new ReportService();
