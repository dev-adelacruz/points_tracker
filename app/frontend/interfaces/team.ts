export interface Team {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  host_count: number;
  emcee_id: number | null;
  emcee_email: string | null;
}
