import type { Host } from '../interfaces/host';
import type { HostPerformanceReport } from '../interfaces/hostPerformance';
import type { QuotaStats } from '../interfaces/quotaStats';

class HostService {
  private baseURL = '/api/v1';

  async getHosts(token: string, filters?: { team_id?: number; active?: boolean }): Promise<Host[]> {
    const params = new URLSearchParams();
    if (filters?.team_id !== undefined) params.set('team_id', String(filters.team_id));
    if (filters?.active !== undefined) params.set('active', String(filters.active));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${this.baseURL}/hosts${query}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch hosts with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Host[];
  }

  async getHost(token: string, id: number): Promise<Host> {
    const response = await fetch(`${this.baseURL}/hosts/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch host with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Host;
  }

  async createHost(token: string, params: { name: string; email: string; password: string; team_id?: number }): Promise<Host> {
    const { team_id, ...hostParams } = params;
    const response = await fetch(`${this.baseURL}/hosts`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ host: hostParams, team_id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to create host with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Host;
  }

  async updateHost(token: string, id: number, params: { name?: string; email?: string; password?: string; team_id?: number | null }): Promise<Host> {
    const { team_id, ...hostParams } = params;
    const response = await fetch(`${this.baseURL}/hosts/${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ host: hostParams, team_id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to update host with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Host;
  }

  async getQuotaStats(token: string): Promise<QuotaStats> {
    const response = await fetch(`${this.baseURL}/host/quota_stats`, {
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
        errorData.status?.message || `Failed to fetch quota stats with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as QuotaStats;
  }

  async getMyPerformance(
    token: string,
    startDate: string,
    endDate: string,
  ): Promise<HostPerformanceReport> {
    const query = new URLSearchParams({ start_date: startDate, end_date: endDate });

    const response = await fetch(`${this.baseURL}/host/performance?${query}`, {
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
          `Failed to fetch performance with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as HostPerformanceReport;
  }

  async deactivateHost(token: string, id: number): Promise<Host> {
    const response = await fetch(`${this.baseURL}/hosts/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to deactivate host with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Host;
  }
}

export const hostService = new HostService();
