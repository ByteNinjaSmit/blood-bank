import type {
  ComponentListFilters,
  ComponentRepo,
  NearExpiryFilters,
} from '@/modules/component/component.repository';
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
    fields: {
      volumeMl?: number;
      storageLocation?: string;
      expiryDate?: string;
      editReason?: string;
    },
    actorId: string,
  ): ReturnType<ComponentRepo['patch']>;
  patchBag(
    donationId: string,
    fields: {
      components: Array<{ unitId?: string; componentType: string; volumeMl: number }>;
      rpmFirstSpin?: string;
      rpmSecondSpin?: string;
      separationTime?: Date;
      editReason: string;
    },
    actorId: string,
  ): ReturnType<ComponentRepo['patchBag']>;
  setBatchDraftActive(donationIds: string[], active: boolean): ReturnType<ComponentRepo['setBatchDraftActive']>;
}

export function createComponentService(deps: { repo: ComponentRepo }): ComponentService {
  return {
    list: (filters) => deps.repo.list(filters),
    listBagsToSeparate: () => deps.repo.listBagsToSeparate(),
    async separate(input) {
      const result = await deps.repo.separate(input);
      // The created unit carries the human-readable donation id (DON-…); use it
      // in the audit rather than whatever id the caller passed (often the Mongo _id).
      const publicDonationId = result?.donationId ?? input.donationId;
      void withAudit(
        { actorId: input.actorId },
        {
          module: 'component',
          action: 'CREATE',
          entityType: 'Component',
          entityId: publicDonationId,
          entityLabel: `${publicDonationId} (${input.componentType})`,
        },
        undefined,
        {
          donationId: publicDonationId,
          componentType: input.componentType,
          volumeMl: input.volumeMl,
        },
      );
      return result;
    },
    async separationCompleted(input) {
      const result = await deps.repo.separationCompleted(input);
      // Prefer the resolved human-readable donation id (DON-…) for the audit,
      // notification and link — the caller may pass the Mongo _id.
      const publicDonationId = result?.donationId ?? input.donationId;
      void withAudit(
        { actorId: input.actorId },
        {
          module: 'component',
          action: 'UPDATE',
          entityType: 'Component',
          entityId: publicDonationId,
          entityLabel: publicDonationId,
          reason: 'separation completed',
        },
        undefined,
        { donationId: publicDonationId, signature: input.signature },
      );
      void notificationCenterService
        .notify({
          title: 'Component separation completed',
          message: `Component separation completed for donation ${publicDonationId}`,
          module: 'COMPONENT_SEPARATION',
          category: 'COMPONENT_SEPARATION_COMPLETED',
          severity: 'SUCCESS',
          relatedRecordId: publicDonationId,
          relatedRecordType: 'Donation',
          actionLink: `/master-register/donations`,
        })
        .catch(() => undefined);
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
        {
          module: 'component',
          action: 'UPDATE',
          entityType: 'ComponentBag',
          entityId: donationId,
          reason: fields.editReason,
        },
        before,
        { components: fields.components },
      );
      return result;
    },
    setBatchDraftActive: (donationIds, active) => deps.repo.setBatchDraftActive(donationIds, active),
  };
}
