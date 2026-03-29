export interface Host {
  id: number;
  name: string;
  email: string;
  active: boolean;
  team_id: number | null;
  team_name: string | null;
}
