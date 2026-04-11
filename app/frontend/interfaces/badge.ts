export interface HostBadge {
  id: number;
  badge_key: string;
  label: string;
  emoji: string;
  description: string;
  earned_on: string;
  notified: boolean;
}

export interface BadgesResponse {
  data: HostBadge[];
  new_badges: HostBadge[];
}
