export interface HostCoinHistoryEntry {
  id: number;
  coins: number;
  session_id: number;
  session_date: string;
  session_slot: 'first' | 'second';
  team_name: string;
}
