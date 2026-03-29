import { useSearchParams } from 'react-router-dom';
import type { EntityFilterState } from '../interfaces/entityFilters';

function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
}

function serializeIds(ids: number[]): string {
  return ids.join(',');
}

export function useEntityFilters(): [
  EntityFilterState,
  {
    setTeams: (ids: number[]) => void;
    setHosts: (ids: number[]) => void;
    setSessions: (ids: number[]) => void;
    clearAll: () => void;
  },
] {
  const [searchParams, setSearchParams] = useSearchParams();

  const state: EntityFilterState = {
    teamIds:    parseIds(searchParams.get('teams')),
    hostIds:    parseIds(searchParams.get('hosts')),
    sessionIds: parseIds(searchParams.get('sessions')),
  };

  const update = (key: string, ids: number[]) => {
    const params = new URLSearchParams(searchParams);
    if (ids.length > 0) {
      params.set(key, serializeIds(ids));
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  return [
    state,
    {
      setTeams:    (ids) => update('teams', ids),
      setHosts:    (ids) => update('hosts', ids),
      setSessions: (ids) => update('sessions', ids),
      clearAll: () => {
        const params = new URLSearchParams(searchParams);
        params.delete('teams');
        params.delete('hosts');
        params.delete('sessions');
        setSearchParams(params, { replace: true });
      },
    },
  ];
}
