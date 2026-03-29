export interface EntityFilterState {
  teamIds: number[];
  hostIds: number[];
  sessionIds: number[];
}

export const EMPTY_ENTITY_FILTERS: EntityFilterState = {
  teamIds: [],
  hostIds: [],
  sessionIds: [],
};
