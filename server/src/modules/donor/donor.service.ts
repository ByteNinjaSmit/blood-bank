import { Types } from 'mongoose';
import { AppError, ConflictError, NotFoundError } from '@/shared/errors';
import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
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
  remove(id: string, actorId: string): Promise<{ permanentlyDeleted: boolean }>;
  restore(id: string, actorId: string): Promise<{ restored: boolean }>;
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
      return created;
    },

    async update(id, patch, actorId) {
      if (patch.weightKg !== undefined || patch.dob !== undefined) {
        const current = await deps.repo.findById(id);
        const merged = {
          weightKg: patch.weightKg ?? current?.weightKg ?? 0,
          dob: patch.dob ?? (current?.dob ? new Date(current.dob) : new Date()),
        };
        assertEligibilityBasics(merged);
      }
      const updated = await deps.repo.update(id, patch, actorId);
      await invalidate(`donor:detail:${id}`);
      log.info({ donorId: id, actorId }, 'donor updated');
      return updated;
    },

    async get(id) {
      return cached(`donor:detail:${id}`, DONOR_DETAIL_TTL, () => deps.repo.findById(id));
    },

    async list(query) {
      const { items, total } = await deps.repo.list(query);
      return { items, total, page: query.page, pageSize: query.pageSize };
    },

    async remove(id, actorId) {
      const donor = await deps.repo.findById(id);
      if (!donor) throw new NotFoundError('Donor', id);

      if (!donor.deletedAt) {
        // First delete click: soft-delete only. Row stays visible (greyed
        // out) in Master Register so the clinical record isn't lost.
        await deps.repo.softDelete(id, actorId);
        await invalidate(`donor:detail:${id}`);
        log.warn({ donorId: id, actorId }, 'donor soft-deleted');
        return { permanentlyDeleted: false };
      }

      // Second delete click on an already soft-deleted donor: permanent,
      // irreversible. Still refuse if donation history exists — hard
      // deleting would orphan clinical records.
      const hasDonations = await DonationModel.exists({ donor: id, deletedAt: null });
      if (hasDonations) {
        throw new AppError(
          'DONOR_HAS_DONATIONS',
          'Donor has existing donation records and cannot be permanently deleted',
          409,
        );
      }
      await deps.repo.delete(id);
      await invalidate(`donor:detail:${id}`);
      log.warn({ donorId: id, actorId }, 'donor permanently deleted');
      return { permanentlyDeleted: true };
    },

    async restore(id, actorId) {
      const donor = await deps.repo.findById(id);
      if (!donor) throw new NotFoundError('Donor', id);
      if (!donor.deletedAt) {
        return { restored: false };
      }
      await deps.repo.restore(id, actorId);
      await invalidate(`donor:detail:${id}`);
      log.warn({ donorId: id, actorId }, 'donor restored');
      return { restored: true };
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
