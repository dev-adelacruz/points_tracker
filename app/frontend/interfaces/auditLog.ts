export interface AuditLog {
  id: number;
  timestamp: string;
  actor_id: number;
  actor_name: string;
  action: 'create' | 'update' | 'deactivate';
  resource_type: string;
  resource_id: number;
  resource_label: string | null;
  changes: Record<string, [unknown, unknown]>;
}

export interface AuditLogMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
