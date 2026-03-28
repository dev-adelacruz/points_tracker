export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  email: string;
  team_name: string | null;
  total_coins: number;
  sessions_count: number;
  monthly_coin_quota: number;
  quota_progress: number;
  is_current_user: boolean;
}

export interface LeaderboardMeta {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface LeaderboardPage {
  data: LeaderboardEntry[];
  meta: LeaderboardMeta;
}
