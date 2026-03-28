export interface CompanyQuotaStat {
  user_id: number;
  email: string;
  total_coins: number;
  monthly_coin_quota: number;
  quota_progress: number;
  paced_monthly_coins: number;
  on_track: boolean | null;
  met_quota: boolean;
}

export interface CompanyQuotaSummary {
  total_hosts: number;
  on_track_count: number;
  off_track_count: number;
  met_quota_count: number;
  company_coin_target: number;
}
