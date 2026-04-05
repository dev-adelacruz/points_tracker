class SystemSettingService {
  private baseURL = '/api/v1/admin/system_settings';

  async getSetting(token: string, key: string): Promise<{ key: string; value: string }> {
    const response = await fetch(`${this.baseURL}/${key}`, {
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
        errorData.status?.message || `Failed to fetch setting with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as { key: string; value: string };
  }

  async updateSetting(
    token: string,
    key: string,
    value: string,
  ): Promise<{ key: string; value: string }> {
    const response = await fetch(`${this.baseURL}/${key}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.status?.message || `Failed to update setting with status ${response.status}`,
      );
    }

    const body = await response.json();
    return body.data as { key: string; value: string };
  }
}

export const systemSettingService = new SystemSettingService();
