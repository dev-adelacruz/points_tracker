export interface Host {
  id: number;
  email: string;
  active: boolean;
  team_id: number | null;
  team_name: string | null;
}
