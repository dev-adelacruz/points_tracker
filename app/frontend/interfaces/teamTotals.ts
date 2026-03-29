export interface TeamTotalsRow {
  team_id: number;
  team_name: string;
  emcee_email: string | null;
  total_coins: number;
  host_count: number;
  avg_coins_per_host: number;
}
