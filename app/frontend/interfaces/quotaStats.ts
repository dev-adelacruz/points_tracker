export interface QuotaStats {
  total_coins: number;
  monthly_coin_quota: number;
  quota_progress: number;
  paced_monthly_coins: number;
  on_track: boolean;
  pacing_delta: number;
  quota_achieved: boolean;
}
