export interface Host {
  id: number;
  name: string;
  email: string;
  active: boolean;
  team_id: number | null;
  team_name: string | null;
}

export interface NotificationSettings {
  email_notifications_enabled: boolean;
}
