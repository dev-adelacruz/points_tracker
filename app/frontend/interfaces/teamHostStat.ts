export interface TeamHostStat {
  user_id: number;
  email: string;
  total_coins: number;
  monthly_coin_quota: number;
  quota_progress: number;
  sessions_attended: number;
  paced_monthly_coins: number;
  on_track: boolean | null;
}
