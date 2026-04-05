import type { AuditLog, AuditLogMeta } from '../interfaces/auditLog';

export interface AuditLogFilters {
  page?: number;
  actor_id?: number;
  action_type?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}

class AuditLogService {
  private baseURL = '/api/v1/admin/audit_logs';

  async getAuditLogs(
    token: string,
    filters: AuditLogFilters = {},
  ): Promise<{ data: AuditLog[]; meta: AuditLogMeta }> {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.actor_id) query.set('actor_id', String(filters.actor_id));
    if (filters.action_type) query.set('action_type', filters.action_type);
    if (filters.resource_type) query.set('resource_type', filters.resource_type);
    if (filters.date_from) query.set('date_from', filters.date_from);
    if (filters.date_to) query.set('date_to', filters.date_to);

    const response = await fetch(`${this.baseURL}?${query}`, {
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
          `Failed to fetch audit logs with status ${response.status}`,
      );
    }

    const body = await response.json();
    return { data: body.data as AuditLog[], meta: body.meta as AuditLogMeta };
  }
}

export const auditLogService = new AuditLogService();
