// Donor domain service. Orchestrates repos, applies business rules,
// emits audit entries. No Express, no Mongoose.

import { ConflictError } from '@/shared/errors';
import { childLogger } from '@/core/logger';
import type {
  CreateDonorInput,
  ListDonorsInput,
  UpdateDonorInput,
} from '@/modules/donor/donor.validator';
import type { DonorDto, DonorRepo } from '@/modules/donor/donor.repository';

const MINIMUM_DONOR_WEIGHT_KG = 45;
const MINIMUM_DONOR_AGE_YEARS = 18;
const MAXIMUM_DONOR_AGE_YEARS = 65;

export interface DonorService {
  register(input: CreateDonorInput, actorId: string): Promise<DonorDto>;
  update(id: string, patch: UpdateDonorInput, actorId: string): Promise<DonorDto>;
  get(id: string): Promise<DonorDto | null>;
  list(query: ListDonorsInput): Promise<{ items: DonorDto[]; total: number; page: number; pageSize: number }>;
  remove(id: string): Promise<void>;
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
      const created = await deps.repo.create(input, actorId);
      log.info({ donorId: created.id, actorId }, 'donor registered');
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
      log.info({ donorId: id, actorId }, 'donor updated');
      return updated;
    },

    async get(id) {
      return deps.repo.findById(id);
    },

    async list(query) {
      const { items, total } = await deps.repo.list(query);
      return { items, total, page: query.page, pageSize: query.pageSize };
    },

    async remove(id) {
      await deps.repo.delete(id);
      log.warn({ donorId: id }, 'donor deleted');
    },
  };
}

function assertEligibilityBasics(input: { weightKg: number; dob: Date }): void {
  if (input.weightKg < MINIMUM_DONOR_WEIGHT_KG) {
    throw new ConflictError(`Donor weight ${input.weightKg}kg below ${MINIMUM_DONOR_WEIGHT_KG}kg minimum`);
  }
  const age = yearsBetween(input.dob, new Date());
  if (age < MINIMUM_DONOR_AGE_YEARS || age > MAXIMUM_DONOR_AGE_YEARS) {
    throw new ConflictError(
      `Donor age ${age} outside acceptable range ${MINIMUM_DONOR_AGE_YEARS}–${MAXIMUM_DONOR_AGE_YEARS}`,
    );
  }
}

function yearsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}
