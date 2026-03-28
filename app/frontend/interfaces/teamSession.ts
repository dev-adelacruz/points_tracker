export interface TeamSessionHostEntry {
  user_id: number;
  email: string;
  coins: number;
  is_guest: boolean;
}

export interface TeamSession {
  id: number;
  date: string;
  session_slot: 'first' | 'second';
  team_name: string;
  total_coins: number;
  top_earner_email: string | null;
  top_earner_coins: number | null;
  host_breakdown: TeamSessionHostEntry[];
}
