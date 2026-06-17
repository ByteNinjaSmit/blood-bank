// Donation domain service. Enforces eligibility, derives units, writes
// atomically via the repo, emits audit log entry. The pure rules
// (eligibility + unit derivation) are tested separately.

import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { checkEligibility, yearsBetween } from '@/modules/donor/donor.eligibility';
import { deriveUnits } from './donation.unit-derivation';
import type {
  CreateDonationInput,
  ListDonationsInput,
} from '@/modules/donation/donation.validator';
import type {
  DonationDto,
  DonationRepo,
  DonationWithUnitsDto,
} from '@/modules/donation/donation.repository';
import type { DonorRepo } from '@/modules/donor/donor.repository';
import type { DeferralRepo } from '@/modules/deferral/deferral.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type { BagIssueRepo } from '@/modules/bag-issue/bag-issue.repository';

export interface DonationService {
  register(input: CreateDonationInput, actorId: string): Promise<DonationWithUnitsDto>;
  list(query: ListDonationsInput): Promise<{
    items: DonationDto[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  get(id: string): Promise<DonationWithUnitsDto>;
}

export function createDonationService(deps: {
  donations: DonationRepo;
  donors: DonorRepo;
  deferrals: DeferralRepo;
  bagStock?: BagStockRepo;
  bagIssues?: BagIssueRepo;
}): DonationService {
  const log = childLogger({ module: 'donation-service' });

  return {
    async register(input, actorId) {
      const donor = await deps.donors.findById(input.donor);
      if (!donor) throw new NotFoundError('Donor', input.donor);

      // Pre-flight eligibility. If the phlebotomist marks the donor as
      // unfit, we still record the event for audit but do not derive
      // units (no blood collected).
      const [latestDonation, activeDeferrals] = await Promise.all([
        deps.donations.findLatestByDonor(input.donor),
        deps.deferrals.findActiveByDonor(input.donor, input.collectedAt),
      ]);
      const eligibility = checkEligibility({
        donor: {
          ageYears: yearsBetween(new Date(donor.dob), input.collectedAt),
          weightKg: input.medicalExam?.weightKg ?? donor.weightKg,
          sex: donor.sex,
          hbGdl: input.medicalExam?.hbGdl,
          pulseBpm: input.medicalExam?.pulseBpm,
          temperatureCelsius: input.medicalExam?.temperatureCelsius,
          bloodPressure: input.medicalExam?.bloodPressure,
          lastDonationDate: latestDonation?.collectedAt,
          lastDonationType: latestDonation?.donationType as
            | CreateDonationInput['donationType']
            | undefined,
          activeDeferrals,
        },
        proposedDonationType: input.donationType,
        now: input.collectedAt,
      });

      if (input.donorFitness.isFit && !eligibility.eligible) {
        log.warn(
          { donor: input.donor, reasons: eligibility.reasons },
          'Donor failed eligibility checks but proceeding since marked fit',
        );
      }

      // Unique-enough donationId. ISBT 128 DIN replaces this in Phase 9.
      const donationPublicId = generateDonationId(input.collectedAt);

      const units = input.donorFitness.isFit
        ? deriveUnits({
            donationId: donationPublicId,
            donationType: input.donationType,
            collectedAt: input.collectedAt,
            overrideTemplates: input.unitTemplates,
          })
        : [];

      const created = await deps.donations.createAtomic({
        input,
        donationPublicId,
        units,
        actorId,
      });

      log.info(
        {
          donationId: donationPublicId,
          donor: input.donor,
          donationType: input.donationType,
          unitCount: units.length,
          isFit: input.donorFitness.isFit,
          actorId,
        },
        'donation registered',
      );

      if (input.lotNo && input.typeOfBag) {
        const mappedBagType = input.typeOfBag === 'DB' ? 'DOUBLE' : input.typeOfBag === 'TB' ? 'TRIPLE' : null;
        if (mappedBagType && deps.bagStock) {
          try {
            const bagStock = await deps.bagStock.findByBatchAndType(input.lotNo, mappedBagType);
            if (bagStock) {
              await deps.bagStock.incrementIssued(bagStock.id, 1, actorId);
              log.info({ donationId: donationPublicId, batchNumber: input.lotNo, bagType: mappedBagType }, 'Bag stock issued count incremented due to donation');
            }
          } catch (err) {
            log.error({ err: (err as Error).message }, 'Failed to increment BagStock issued count');
          }
        }
      }

      if (input.bagNo && deps.bagIssues) {
        try {
          const bagIssue = await deps.bagIssues.findBySerialNumber(input.bagNo);
          if (bagIssue) {
            await deps.bagIssues.updateStatus(bagIssue.id, {
              status: 'USED',
              donorId: input.donor,
              donationId: created.id,
              usedAt: new Date(),
            }, actorId);
            log.info({ bagSerialNumber: input.bagNo, donationId: created.id }, 'BagIssue marked as USED');
          }
        } catch (err) {
          log.error({ err: (err as Error).message }, 'Failed to mark BagIssue as USED');
        }
      }

      return created;
    },

    async list(query) {
      const { items, total } = await deps.donations.list(query);
      return { items, total, page: query.page, pageSize: query.pageSize };
    },

    async get(id) {
      const found = await deps.donations.findById(id);
      if (!found) throw new NotFoundError('Donation', id);
      return found;
    },
  };
}

function generateDonationId(collectedAt: Date): string {
  const yyyy = collectedAt.getUTCFullYear();
  const mm = String(collectedAt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(collectedAt.getUTCDate()).padStart(2, '0');
  const rand = new Types.ObjectId().toHexString().slice(-6).toUpperCase();
  return `DN-${yyyy}${mm}${dd}-${rand}`;
}
