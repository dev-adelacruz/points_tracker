export interface PeriodComparisonRow {
  entity_type: 'host';
  entity_id: number;
  entity_name: string;
  period_a_total: number;
  period_b_total: number;
  delta: number;
  delta_pct: number | null;
}

export interface PeriodComparisonParams {
  period_a_start: string;  // YYYY-MM-DD
  period_a_end: string;
  period_b_start: string;
  period_b_end: string;
  scope?: 'all_hosts' | 'team' | 'host';
  scope_id?: number;
}
