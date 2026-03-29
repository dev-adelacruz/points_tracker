export interface HostPerformanceSession {
  session_id: number;
  date: string;       // YYYY-MM-DD
  session_slot: 'slot_one' | 'slot_two';
  team_id: number;
  coins: number;
  attended: boolean;
}

export interface HostPerformanceDailyTotal {
  date: string;
  coins: number;
}

export interface HostPerformanceWeeklyTotal {
  week_start: string;
  coins: number;
}

export interface HostPerformanceReport {
  host_id: number;
  host_email: string;
  start_date: string;
  end_date: string;
  monthly_total: number;
  sessions: HostPerformanceSession[];
  daily_totals: HostPerformanceDailyTotal[];
  weekly_totals: HostPerformanceWeeklyTotal[];
}
