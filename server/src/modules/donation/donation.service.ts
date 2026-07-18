// Donation domain service. Enforces eligibility, derives units, writes
// atomically via the repo, emits audit log entry. The pure rules
// (eligibility + unit derivation) are tested separately.

import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import {
  cascadeSoftDelete,
  cascadeRestore,
  runInCascadeTransaction,
  newDeleteBatchId,
} from '@/shared/utils/cascade-delete';
import { donationNode } from '@/shared/cascade-registry';
import { AppError, ConflictError, NotFoundError } from '@/shared/errors';
import { checkEligibility, yearsBetween } from '@/modules/donor/donor.eligibility';
import { deriveUnits } from './donation.unit-derivation';
import { BloodUnitModel } from '@/modules/unit/unit.model';
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
import { notificationCenterService } from '@/modules/notification/notification-center.service';

export interface DonationService {
  register(input: CreateDonationInput, actorId: string): Promise<DonationWithUnitsDto>;
  list(query: ListDonationsInput): Promise<{
    items: DonationDto[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  get(id: string): Promise<DonationWithUnitsDto>;
  remove(id: string, actorId: string, reason: string): Promise<{ permanentlyDeleted: boolean }>;
  restore(id: string, actorId: string): Promise<{ restored: boolean }>;
  permanentDelete(id: string, actorId: string, reason: string): Promise<void>;
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

      const dbLastDonation = latestDonation?.collectedAt;
      const donorLastDonation = donor.lastDonationDate ? new Date(donor.lastDonationDate) : undefined;
      let effectiveLastDonationDate: Date | undefined = undefined;

      if (dbLastDonation && donorLastDonation) {
        effectiveLastDonationDate = dbLastDonation > donorLastDonation ? dbLastDonation : donorLastDonation;
      } else {
        effectiveLastDonationDate = dbLastDonation || donorLastDonation;
      }

      if (effectiveLastDonationDate) {
        const daysSince = Math.floor(
          (new Date(input.collectedAt).getTime() - effectiveLastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const requiredInterval = donor.sex === 'F' ? 120 : 90;
        if (daysSince < requiredInterval) {
          throw new ConflictError(
            `Donor cannot donate yet. Last donation was on ${effectiveLastDonationDate.toISOString().slice(0, 10)}. ` +
            `The waiting period is ${requiredInterval === 120 ? '120 days (4 months)' : '90 days (3 months)'}. ` +
            `Only ${daysSince} day(s) have passed.`
          );
        }
      }

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

      void withAudit(
        { actorId },
        { module: 'donation', action: 'CREATE', entityType: 'Donation', entityId: created.id, entityLabel: donationPublicId },
        undefined,
        {
          donationId: donationPublicId,
          donor: input.donor,
          campId: input.campId,
          donationType: input.donationType,
          unitCount: units.length,
        },
      );

      if (input.donorFitness.isFit && units.length > 0) {
        void notificationCenterService
          .notify({
            title: 'Donation completed',
            message: `Donation ${donationPublicId} collected with ${units.length} unit(s)`,
            module: 'COLLECTION',
            category: 'DONATION_COMPLETED',
            severity: 'INFORMATION',
            relatedRecordId: created.id,
            relatedRecordType: 'Donation',
            actionLink: `/donation-management/${created.id}`,
          })
          .catch(() => undefined);
        void notificationCenterService
          .notify({
            title: 'Component separation pending',
            message: `${units.length} unit(s) from donation ${donationPublicId} await component separation`,
            module: 'COMPONENT_SEPARATION',
            category: 'COMPONENT_SEPARATION_PENDING',
            severity: 'WARNING',
            relatedRecordId: created.id,
            relatedRecordType: 'Donation',
            actionLink: `/component-separation`,
            dedupeKey: `COMPONENT_SEPARATION_PENDING:${created.id}`,
          })
          .catch(() => undefined);
      } else {
        void notificationCenterService
          .notify({
            title: 'Collection cancelled',
            message: `Donation ${donationPublicId} recorded as unfit — no units collected`,
            module: 'COLLECTION',
            category: 'COLLECTION_CANCELLED',
            severity: 'WARNING',
            relatedRecordId: created.id,
            relatedRecordType: 'Donation',
            actionLink: `/donation-management/${created.id}`,
          })
          .catch(() => undefined);
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

    async remove(id, actorId, reason) {
      const status = await deps.donations.findRawStatus(id);
      if (!status) throw new NotFoundError('Donation', id);
      if (status.deletedAt) {
        // Already soft-deleted (e.g. double-click) — idempotent no-op.
        // Permanent removal now only happens via permanentDelete(), from
        // the Recycle Bin.
        return { permanentlyDeleted: false };
      }

      const deleteBatchId = newDeleteBatchId();
      await runInCascadeTransaction((session) =>
        cascadeSoftDelete(donationNode, id, actorId, reason, deleteBatchId, session),
      );
      log.warn({ donationId: id, actorId, deleteBatchId }, 'donation cascade soft-deleted');
      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'DELETE',
          entityType: 'Donation',
          entityId: id,
          severity: 'warning',
          reason,
        },
        { deletedAt: null },
        { deletedAt: new Date(), deleteBatchId },
      );
      return { permanentlyDeleted: false };
    },

    async restore(id, actorId) {
      const status = await deps.donations.findRawStatus(id);
      if (!status) throw new NotFoundError('Donation', id);
      if (!status.deletedAt) {
        return { restored: false };
      }
      await runInCascadeTransaction((session) => cascadeRestore(donationNode, id, actorId, session));
      log.warn({ donationId: id, actorId }, 'donation cascade restored');
      void withAudit(
        { actorId },
        { module: 'donation', action: 'UPDATE', entityType: 'Donation', entityId: id },
        { deletedAt: status.deletedAt },
        { deletedAt: null },
      );
      return { restored: true };
    },

    async permanentDelete(id, actorId, reason) {
      const status = await deps.donations.findRawStatus(id);
      if (!status) throw new NotFoundError('Donation', id);
      if (!status.deletedAt) {
        throw new ConflictError('Donation must be soft-deleted before it can be permanently deleted');
      }
      // Refuse if active (non-deleted) blood units still reference it —
      // hard-deleting would orphan those clinical records. The
      // donation's own units were already cascade-affected/discarded by
      // remove(); this guards a unit created after the fact.
      const donation = await deps.donations.findById(id);
      const hasUnits = donation
        ? await BloodUnitModel.exists({
            donationId: donation.donationId,
            affected: { $ne: true },
            status: { $nin: ['DISCARDED', 'EXPIRED'] },
          })
        : false;
      if (hasUnits) {
        throw new AppError(
          'DONATION_HAS_UNITS',
          'Donation has blood units derived from it and cannot be permanently deleted',
          409,
        );
      }
      await deps.donations.delete(id);
      log.warn({ donationId: id, actorId }, 'donation permanently deleted');
      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'DELETE',
          entityType: 'Donation',
          entityId: id,
          severity: 'critical',
          reason,
        },
        donation,
        undefined,
      );
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
