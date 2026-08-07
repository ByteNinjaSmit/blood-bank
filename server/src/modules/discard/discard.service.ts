import type {
  DiscardCreateInput,
  DiscardListFilters,
  DiscardRepo,
} from '@/modules/discard/discard.repository';

export interface DiscardService {
  list(filters: DiscardListFilters): ReturnType<DiscardRepo['list']>;
  create(input: DiscardCreateInput): ReturnType<DiscardRepo['create']>;
  restoreCascadeDiscarded(
    unitId: string,
    actorId: string,
  ): ReturnType<DiscardRepo['restoreCascadeDiscarded']>;
}

export function createDiscardService(deps: { repo: DiscardRepo }): DiscardService {
  return {
    list: (filters) => deps.repo.list(filters),
    create: (input) => deps.repo.create(input),
    restoreCascadeDiscarded: (unitId, actorId) =>
      deps.repo.restoreCascadeDiscarded(unitId, actorId),
  };
}
