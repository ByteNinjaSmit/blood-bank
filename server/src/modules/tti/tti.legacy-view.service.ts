import type {
  TtiLegacyViewRepo,
  TtiBagListFilters,
  TtiResultListFilters,
  PagedTtiBags,
} from '@/modules/tti/tti.legacy-view.repository';

export interface TtiLegacyViewService {
  listQuarantined(filters: TtiBagListFilters): Promise<PagedTtiBags>;
  listDecided(filters: TtiResultListFilters): Promise<PagedTtiBags>;
  setBatchDraftActive(donationIds: string[], active: boolean): Promise<void>;
}

export function createTtiLegacyViewService(deps: {
  view: TtiLegacyViewRepo;
}): TtiLegacyViewService {
  return {
    listQuarantined: (filters) => deps.view.listQuarantined(filters),
    listDecided: (filters) => deps.view.listDecided(filters),
    setBatchDraftActive: (donationIds, active) => deps.view.setBatchDraftActive(donationIds, active),
  };
}
