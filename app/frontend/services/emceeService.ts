import type { Emcee } from '../interfaces/emcee';

class EmceeService {
  private baseURL = '/api/v1';

  async getEmcees(token: string): Promise<Emcee[]> {
    const response = await fetch(`${this.baseURL}/emcees`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch emcees with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Emcee[];
  }

  async createEmcee(
    token: string,
    params: { name: string; email: string; password: string }
  ): Promise<Emcee> {
    const response = await fetch(`${this.baseURL}/emcees`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emcee: params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status?.message || `Failed to create emcee with status ${response.status}`);
    }

    const body = await response.json();
    return body.data as Emcee;
  }
}

export const emceeService = new EmceeService();
