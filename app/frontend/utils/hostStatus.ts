export type HostStatus = 'on_track' | 'at_risk' | 'behind';

/**
 * Derives a 3-state status from quota pacing data.
 *
 * - on_track  — total_coins >= paced_monthly_coins
 * - at_risk   — behind pace but deficit is ≤ 20% of monthly quota
 * - behind    — deficit > 20% of monthly quota
 *
 * Returns null when on_track is null (no data / quota not set).
 */
export function getHostStatus(stat: {
  on_track: boolean | null;
  total_coins: number;
  paced_monthly_coins: number;
  monthly_coin_quota: number;
}): HostStatus | null {
  if (stat.on_track === null) return null;
  if (stat.on_track) return 'on_track';

  const deficit = stat.paced_monthly_coins - stat.total_coins;
  const threshold = stat.monthly_coin_quota * 0.2;
  return deficit <= threshold ? 'at_risk' : 'behind';
}

export const STATUS_LABELS: Record<HostStatus, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  behind: 'Behind',
};

/** Tailwind classes for bar fills using design-system tokens */
export const STATUS_BAR: Record<HostStatus, string> = {
  on_track: 'bg-ok',
  at_risk: 'bg-warn',
  behind: 'bg-bad',
};

/** Tailwind classes for badge backgrounds + text using design-system tokens */
export const STATUS_BADGE: Record<HostStatus, string> = {
  on_track: 'bg-green-50 text-green-700 border-green-200',
  at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
  behind: 'bg-red-50 text-red-600 border-red-200',
};

/** Tailwind text color classes for inline labels */
export const STATUS_TEXT: Record<HostStatus, string> = {
  on_track: 'text-ok',
  at_risk: 'text-warn',
  behind: 'text-bad',
};
