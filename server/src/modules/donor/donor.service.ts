import { Types } from 'mongoose';
import { AppError, ConflictError, NotFoundError } from '@/shared/errors';
import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
import { withAudit } from '@/shared/utils/with-audit';
import {
  cascadeSoftDelete,
  cascadeRestore,
  runInCascadeTransaction,
  newDeleteBatchId,
} from '@/shared/utils/cascade-delete';
import { donorCascadeNode } from '@/shared/cascade-registry';
import type {
  CreateDonorInput,
  ListDonorsInput,
  UpdateDonorInput,
} from '@/modules/donor/donor.validator';
import type { DonorDto, DonorRepo } from '@/modules/donor/donor.repository';
import { CampModel } from '@/modules/camp/camp.model';
import { DonationModel } from '@/modules/donation/donation.model';

const MINIMUM_DONOR_WEIGHT_KG = 45;
const MINIMUM_DONOR_AGE_YEARS = 18;
const MAXIMUM_DONOR_AGE_YEARS = 65;
const DONOR_DETAIL_TTL = 60; // 60s — profile changes occasionally

export interface DonorService {
  register(input: CreateDonorInput, actorId: string): Promise<DonorDto>;
  update(id: string, patch: UpdateDonorInput, actorId: string): Promise<DonorDto>;
  get(id: string): Promise<DonorDto | null>;
  list(
    query: ListDonorsInput,
  ): Promise<{ items: DonorDto[]; total: number; page: number; pageSize: number }>;
  remove(id: string, actorId: string, reason: string): Promise<{ permanentlyDeleted: boolean }>;
  restore(id: string, actorId: string): Promise<{ restored: boolean }>;
  permanentDelete(id: string, actorId: string, reason: string): Promise<void>;
}

export function createDonorService(deps: { repo: DonorRepo }): DonorService {
  const log = childLogger({ module: 'donor-service' });

  return {
    async register(input, actorId) {
      assertEligibilityBasics(input);
      const existing = await deps.repo.findActiveByPhone(input.phone);
      if (existing) {
        throw new ConflictError('A donor with this phone already exists', {
          existingDonorId: existing.id,
        });
      }
      const created = await deps.repo.create(
        { ...input, donorId: generateDonorId() },
        actorId,
      );
      if (input.campId) {
        await CampModel.findByIdAndUpdate(input.campId, {
          $addToSet: { donorData: created.id }
        });
      }
      await invalidate('donor:detail:*');
      log.info({ donorId: created.id, actorId, campId: input.campId }, 'donor registered');
      void withAudit(
        { actorId },
        { module: 'donor', action: 'CREATE', entityType: 'Donor', entityId: created.id, entityLabel: created.donorId },
        undefined,
        { donorId: created.donorId, phone: input.phone, campId: input.campId },
      );
      return created;
    },

    async update(id, patch, actorId) {
      const before = await deps.repo.findById(id);
      if (patch.weightKg !== undefined || patch.dob !== undefined) {
        const merged = {
          weightKg: patch.weightKg ?? before?.weightKg ?? 0,
          dob: patch.dob ?? (before?.dob ? new Date(before.dob) : new Date()),
        };
        assertEligibilityBasics(merged);
      }
      const updated = await deps.repo.update(id, patch, actorId);
      await invalidate(`donor:detail:${id}`);
      log.info({ donorId: id, actorId }, 'donor updated');
      void withAudit(
        { actorId },
        { module: 'donor', action: 'UPDATE', entityType: 'Donor', entityId: id, entityLabel: before?.donorId },
        before,
        updated,
      );
      return updated;
    },

    async get(id) {
      return cached(`donor:detail:${id}`, DONOR_DETAIL_TTL, () => deps.repo.findById(id));
    },

    async list(query) {
      const { items, total } = await deps.repo.list(query);
      return { items, total, page: query.page, pageSize: query.pageSize };
    },

    async remove(id, actorId, reason) {
      const donor = await deps.repo.findById(id);
      if (!donor) throw new NotFoundError('Donor', id);

      if (donor.deletedAt) {
        // Already soft-deleted (e.g. double-click) — idempotent no-op.
        // Permanent removal now only happens via permanentDelete(), from
        // the Recycle Bin.
        return { permanentlyDeleted: false };
      }

      const deleteBatchId = newDeleteBatchId();
      await runInCascadeTransaction((session) =>
        cascadeSoftDelete(donorCascadeNode, id, actorId, reason, deleteBatchId, session),
      );
      await invalidate(`donor:detail:${id}`);
      log.warn({ donorId: id, actorId, deleteBatchId }, 'donor cascade soft-deleted');
      void withAudit(
        { actorId },
        {
          module: 'donor',
          action: 'DELETE',
          entityType: 'Donor',
          entityId: id,
          entityLabel: donor.donorId,
          severity: 'warning',
          reason,
        },
        { deletedAt: null },
        { deletedAt: new Date(), deleteBatchId },
      );
      return { permanentlyDeleted: false };
    },

    async restore(id, actorId) {
      const donor = await deps.repo.findById(id);
      if (!donor) throw new NotFoundError('Donor', id);
      if (!donor.deletedAt) {
        return { restored: false };
      }
      await runInCascadeTransaction((session) => cascadeRestore(donorCascadeNode, id, actorId, session));
      await invalidate(`donor:detail:${id}`);
      log.warn({ donorId: id, actorId }, 'donor cascade restored');
      void withAudit(
        { actorId },
        { module: 'donor', action: 'UPDATE', entityType: 'Donor', entityId: id, entityLabel: donor.donorId },
        { deletedAt: donor.deletedAt },
        { deletedAt: null },
      );
      return { restored: true };
    },

    async permanentDelete(id, actorId, reason) {
      const donor = await deps.repo.findById(id);
      if (!donor) throw new NotFoundError('Donor', id);
      if (!donor.deletedAt) {
        throw new ConflictError('Donor must be soft-deleted before it can be permanently deleted');
      }
      // Still refuse if active (non-deleted) donation history exists —
      // hard-deleting the donor row while an active donation still
      // references it would orphan that clinical record. The donor's own
      // donations were already cascade-soft-deleted by remove(); this
      // guards against donations created *after* the donor was deleted.
      const hasActiveDonations = await DonationModel.exists({ donor: id, deletedAt: null });
      if (hasActiveDonations) {
        throw new AppError(
          'DONOR_HAS_DONATIONS',
          'Donor has active donation records and cannot be permanently deleted',
          409,
        );
      }
      await deps.repo.delete(id);
      await invalidate(`donor:detail:${id}`);
      log.warn({ donorId: id, actorId }, 'donor permanently deleted');
      void withAudit(
        { actorId },
        {
          module: 'donor',
          action: 'DELETE',
          entityType: 'Donor',
          entityId: id,
          entityLabel: donor.donorId,
          severity: 'critical',
          reason,
        },
        donor,
        undefined,
      );
    },
  };
}

function assertEligibilityBasics(input: { weightKg: number; dob: Date }): void {
  if (input.weightKg < MINIMUM_DONOR_WEIGHT_KG) {
    throw new ConflictError(
      `Donor weight ${input.weightKg}kg below ${MINIMUM_DONOR_WEIGHT_KG}kg minimum`,
    );
  }
  const age = yearsBetween(input.dob, new Date());
  if (age < MINIMUM_DONOR_AGE_YEARS || age > MAXIMUM_DONOR_AGE_YEARS) {
    throw new ConflictError(
      `Donor age ${age} outside acceptable range ${MINIMUM_DONOR_AGE_YEARS}–${MAXIMUM_DONOR_AGE_YEARS}`,
    );
  }
}

function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

// Every donor — including deferred ones — gets one of these, assigned at
// registration time regardless of eligibilityStatus. Format mirrors
// donation.service.ts's generateDonationId: PREFIX-YYYYMMDD-XXXXXX.
function generateDonorId(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const rand = new Types.ObjectId().toHexString().slice(-6).toUpperCase();
  return `DNR-${yyyy}${mm}${dd}-${rand}`;
}
