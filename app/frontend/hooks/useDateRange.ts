import { useSearchParams } from 'react-router-dom';
import type { DateRange, DateRangePreset } from '../interfaces/dateRange';

const toISO = (d: Date): string => d.toISOString().slice(0, 10);

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-first
  result.setDate(result.getDate() + diff);
  return result;
}

export function computePresetDates(
  preset: Exclude<DateRangePreset, 'custom'>,
): { startDate: string; endDate: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      return { startDate: toISO(today), endDate: toISO(today) };

    case 'this_week': {
      return { startDate: toISO(startOfWeek(today)), endDate: toISO(today) };
    }

    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISO(start), endDate: toISO(today) };
    }

    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toISO(start), endDate: toISO(end) };
    }

    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: toISO(start), endDate: toISO(today) };
    }

    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: toISO(start), endDate: toISO(today) };
    }
  }
}

const DEFAULT_PRESET: DateRangePreset = 'this_month';
const VALID_PRESETS = new Set<string>([
  'today', 'this_week', 'this_month', 'last_month', 'last_7_days', 'last_30_days', 'custom',
]);

export function useDateRange(): [
  DateRange,
  (preset: DateRangePreset, start?: string, end?: string) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPreset = searchParams.get('range') ?? DEFAULT_PRESET;
  const preset: DateRangePreset = VALID_PRESETS.has(rawPreset)
    ? (rawPreset as DateRangePreset)
    : DEFAULT_PRESET;

  let startDate: string;
  let endDate: string;

  if (preset === 'custom') {
    startDate = searchParams.get('start') ?? toISO(new Date());
    endDate   = searchParams.get('end')   ?? toISO(new Date());
  } else {
    ({ startDate, endDate } = computePresetDates(preset));
  }

  const setDateRange = (
    nextPreset: DateRangePreset,
    start?: string,
    end?: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', nextPreset);

    if (nextPreset === 'custom') {
      if (start) params.set('start', start);
      if (end)   params.set('end', end);
    } else {
      params.delete('start');
      params.delete('end');
    }

    setSearchParams(params, { replace: true });
  };

  return [{ preset, startDate, endDate }, setDateRange];
}
