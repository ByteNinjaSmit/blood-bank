import type { ComponentListFilters, ComponentRepo, NearExpiryFilters } from '@/modules/component/component.repository';
import { withAudit } from '@/shared/utils/with-audit';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

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
    fields: { volumeMl?: number; storageLocation?: string; expiryDate?: string; editReason?: string },
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
    async separate(input) {
      const result = await deps.repo.separate(input);
      void withAudit(
        { actorId: input.actorId },
        { module: 'component', action: 'CREATE', entityType: 'Component', entityId: input.donationId, entityLabel: `${input.donationId} (${input.componentType})` },
        undefined,
        { donationId: input.donationId, componentType: input.componentType, volumeMl: input.volumeMl },
      );
      return result;
    },
    async separationCompleted(input) {
      const result = await deps.repo.separationCompleted(input);
      void withAudit(
        { actorId: input.actorId },
        { module: 'component', action: 'UPDATE', entityType: 'Component', entityId: input.donationId, reason: 'separation completed' },
        undefined,
        { signature: input.signature },
      );
      void notificationCenterService
        .notify({
          title: 'Component separation completed',
          message: `Component separation completed for donation ${input.donationId}`,
          module: 'COMPONENT_SEPARATION',
          category: 'COMPONENT_SEPARATION_COMPLETED',
          severity: 'SUCCESS',
          relatedRecordId: input.donationId,
          relatedRecordType: 'Donation',
          actionLink: `/donation-management/${input.donationId}`,
        })
        .catch(() => undefined);
      return result;
    },
    nearExpiry: (filters) => deps.repo.nearExpiry(filters),
    getGroupDetail: (id) => deps.repo.getGroupDetail(id),
    async patch(id, fields, actorId) {
      const { editReason, ...rest } = fields;
      const before = await deps.repo.getUnitSnapshot(id);
      const result = await deps.repo.patch(id, rest, actorId);
      void withAudit(
        { actorId },
        {
          module: 'component',
          action: 'UPDATE',
          entityType: 'Component',
          entityId: id,
          entityLabel: before?.unitId,
          reason: editReason,
        },
        before,
        rest,
      );
      return result;
    },
    async patchBag(donationId, fields, actorId) {
      const before = await deps.repo.getBagSnapshot(donationId);
      const result = await deps.repo.patchBag(donationId, fields, actorId);
      void withAudit(
        { actorId },
        { module: 'component', action: 'UPDATE', entityType: 'ComponentBag', entityId: donationId, reason: fields.editReason },
        before,
        { components: fields.components },
      );
      return result;
    },
  };
}
