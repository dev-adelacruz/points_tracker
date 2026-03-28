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
}

export const emceeService = new EmceeService();
