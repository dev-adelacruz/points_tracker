export interface Session {
  id: number;
  date: string;
  session_slot: 'first' | 'second';
  team_id: number;
  team_name: string;
  created_by_id: number;
  host_ids: number[];
  host_names: string[];
}
