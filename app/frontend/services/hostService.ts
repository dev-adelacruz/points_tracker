import type { Host } from '../interfaces/host';

class HostService {
  private baseURL = '/api/v1';

  async getHosts(token: string): Promise<Host[]> {
    const response = await fetch(`${this.baseURL}/hosts`, {
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
}

export const hostService = new HostService();
