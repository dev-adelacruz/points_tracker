import type { CompanyQuotaStat, CompanyQuotaSummary } from '../interfaces/companyQuotaStat';

interface CompanyQuotaResponse {
  summary: CompanyQuotaSummary;
  data: CompanyQuotaStat[];
}

class CompanyQuotaService {
  private baseURL = '/api/v1/admin';

  async getCompanyQuotaStats(
    token: string,
    params?: { date_from?: string; date_to?: string; sort?: 'asc' | 'desc' }
  ): Promise<CompanyQuotaResponse> {
    const url = new URL(`${this.baseURL}/company_quota_stats`, window.location.origin);
    if (params?.date_from) url.searchParams.set('date_from', params.date_from);
    if (params?.date_to) url.searchParams.set('date_to', params.date_to);
    if (params?.sort) url.searchParams.set('sort', params.sort);

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
      throw new Error(errorData.status?.message || `Failed to fetch company quota stats with status ${response.status}`);
    }

    const body = await response.json();
    return { summary: body.summary, data: body.data } as CompanyQuotaResponse;
  }

  async updateSystemSetting(token: string, key: string, value: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/system_settings/${key}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to update setting with status ${response.status}`);
    }
  }
}

export const companyQuotaService = new CompanyQuotaService();
