export interface EmceePerformanceRow {
  emcee_id: number;
  emcee_name: string;
  assigned_team_names: string[];
  sessions_logged: number;
  sessions_with_coins: number;
  completion_pct: number;
  last_active_at: string | null;
}
