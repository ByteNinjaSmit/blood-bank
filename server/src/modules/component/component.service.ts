import type { ComponentListFilters, ComponentRepo, NearExpiryFilters } from '@/modules/component/component.repository';

export interface ComponentService {
  list(filters: ComponentListFilters): ReturnType<ComponentRepo['list']>;
  listBagsToSeparate(): ReturnType<ComponentRepo['listBagsToSeparate']>;
  separate(input: {
    donationId: string;
    componentType: string;
    volumeMl?: number;
    rpmFirstSpin?: string;
    rpmSecondSpin?: string;
    separationTime?: Date;
    actorId: string;
  }): ReturnType<ComponentRepo['separate']>;
  separationCompleted(input: {
    donationId: string;
    signature: string;
    actorId: string;
  }): Promise<void>;
  nearExpiry(filters: NearExpiryFilters): ReturnType<ComponentRepo['nearExpiry']>;
  getGroupDetail(id: string): ReturnType<ComponentRepo['getGroupDetail']>;
  patch(
    id: string,
    fields: { volumeMl?: number; storageLocation?: string; expiryDate?: string },
    actorId: string,
  ): ReturnType<ComponentRepo['patch']>;
  patchBag(
    donationId: string,
    fields: {
      components: Array<{ unitId: string; componentType: string; volumeMl: number }>;
      rpmFirstSpin?: string;
      rpmSecondSpin?: string;
      separationTime?: Date;
      editReason: string;
    },
    actorId: string,
  ): ReturnType<ComponentRepo['patchBag']>;
}

export function createComponentService(deps: { repo: ComponentRepo }): ComponentService {
  return {
    list: (filters) => deps.repo.list(filters),
    listBagsToSeparate: () => deps.repo.listBagsToSeparate(),
    separate: (input) => deps.repo.separate(input),
    separationCompleted: (input) => deps.repo.separationCompleted(input),
    nearExpiry: (filters) => deps.repo.nearExpiry(filters),
    getGroupDetail: (id) => deps.repo.getGroupDetail(id),
    patch: (id, fields, actorId) => deps.repo.patch(id, fields, actorId),
    patchBag: (donationId, fields, actorId) => deps.repo.patchBag(donationId, fields, actorId),
  };
}
