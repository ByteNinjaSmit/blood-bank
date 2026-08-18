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
import { donationNode, campDonationNode } from '@/shared/cascade-registry';
import { findOwningModel } from '@/modules/donation/donation-collections.util';
import { CampDonationRecordModel } from '@/modules/donation/camp-donation-record.model';
import { AppError, ConflictError, NotFoundError } from '@/shared/errors';
import { checkEligibility, yearsBetween } from '@/modules/donor/donor.eligibility';
import { deriveUnits } from './donation.unit-derivation';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import type {
  CreateDonationInput,
  ListDonationsInput,
  UpdateDonationInput,
  CreateInwardDonationInput,
  LinkDonorInput,
  MedicalHistoryInput,
  FinalizeInwardInput,
  ListIncompleteInput,
} from '@/modules/donation/donation.validator';
import type {
  DonationDto,
  DonationRepo,
  DonationWithUnitsDto,
  IncompleteDonationRow,
} from '@/modules/donation/donation.repository';
import type { DonorRepo } from '@/modules/donor/donor.repository';
import type { DonorService } from '@/modules/donor/donor.service';
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
  update(id: string, input: UpdateDonationInput, actorId: string): Promise<DonationWithUnitsDto>;

  // ── Inward Donation (bag-first) ──
  createInward(input: CreateInwardDonationInput, actorId: string): Promise<DonationWithUnitsDto>;
  linkDonor(
    donationId: string,
    input: LinkDonorInput,
    actorId: string,
  ): Promise<DonationWithUnitsDto>;
  saveMedicalHistory(
    donationId: string,
    input: MedicalHistoryInput,
    actorId: string,
  ): Promise<DonationWithUnitsDto>;
  finalizeInward(
    donationId: string,
    input: FinalizeInwardInput,
    actorId: string,
  ): Promise<DonationWithUnitsDto>;
  listIncomplete(
    query: ListIncompleteInput,
  ): Promise<{ items: IncompleteDonationRow[]; total: number; page: number; pageSize: number }>;
}

export function createDonationService(deps: {
  donations: DonationRepo;
  donors: DonorRepo;
  deferrals: DeferralRepo;
  bagStock?: BagStockRepo;
  bagIssues?: BagIssueRepo;
  /** Full donor create path (eligibility validation etc.) — used by linkDonor() for a brand-new donor. */
  donorService?: DonorService;
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
      const donorLastDonation = donor.lastDonationDate
        ? new Date(donor.lastDonationDate)
        : undefined;
      let effectiveLastDonationDate: Date | undefined = undefined;

      if (dbLastDonation && donorLastDonation) {
        effectiveLastDonationDate =
          dbLastDonation > donorLastDonation ? dbLastDonation : donorLastDonation;
      } else {
        effectiveLastDonationDate = dbLastDonation || donorLastDonation;
      }

      if (effectiveLastDonationDate) {
        const daysSince = Math.floor(
          (new Date(input.collectedAt).getTime() - effectiveLastDonationDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const requiredInterval = donor.sex === 'F' ? 120 : 90;
        if (daysSince < requiredInterval) {
          throw new ConflictError(
            `Donor cannot donate yet. Last donation was on ${effectiveLastDonationDate.toISOString().slice(0, 10)}. ` +
              `The waiting period is ${requiredInterval === 120 ? '120 days (4 months)' : '90 days (3 months)'}. ` +
              `Only ${daysSince} day(s) have passed.`,
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
            bagNo: input.bagNo,
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
        const mappedBagType =
          input.typeOfBag === 'DB' ? 'DOUBLE' : input.typeOfBag === 'TB' ? 'TRIPLE' : null;
        if (mappedBagType && deps.bagStock) {
          try {
            const bagStock = await deps.bagStock.findByBatchAndType(input.lotNo, mappedBagType);
            if (bagStock) {
              await deps.bagStock.incrementIssued(bagStock.id, 1, actorId);
              log.info(
                { donationId: donationPublicId, batchNumber: input.lotNo, bagType: mappedBagType },
                'Bag stock issued count incremented due to donation',
              );
            }
          } catch (err) {
            log.error({ err: (err as Error).message }, 'Failed to increment BagStock issued count');
          }
        }
      }

      await linkBagIssueUsed(deps, log, {
        bagNo: input.bagNo,
        donorId: input.donor,
        donationId: created.id,
        segmentNo: input.segmentNo,
        actorId,
      });

      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'CREATE',
          entityType: 'Donation',
          entityId: created.id,
          entityLabel: donationPublicId,
        },
        undefined,
        {
          donationId: donationPublicId,
          // Show the human-readable donor id (DNR-…) in the audit snapshot,
          // not the raw Mongo ObjectId.
          donor: donor.donorId ?? input.donor,
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
            actionLink: `/master-register/donations`,
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
            actionLink: `/component/separate`,
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
            actionLink: `/master-register/donations`,
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
      const owningModel = await findOwningModel(id);
      const node = owningModel === CampDonationRecordModel ? campDonationNode : donationNode;
      await runInCascadeTransaction((session) =>
        cascadeSoftDelete(node, id, actorId, reason, deleteBatchId, session),
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
      const owningModel = await findOwningModel(id);
      const node = owningModel === CampDonationRecordModel ? campDonationNode : donationNode;
      await runInCascadeTransaction((session) =>
        cascadeRestore(node, id, actorId, session),
      );
      log.warn({ donationId: id, actorId }, 'donation cascade restored');
      void withAudit(
        { actorId },
        { module: 'donation', action: 'UPDATE', entityType: 'Donation', entityId: id },
        { deletedAt: status.deletedAt },
        { deletedAt: null },
      );
      return { restored: true };
    },

    async update(id, input, actorId) {
      const existing = await deps.donations.findById(id);
      if (!existing) throw new NotFoundError('Donation', id);

      const identifierChanged =
        (input.bagNo !== undefined && input.bagNo !== existing.bagNo) ||
        (input.lotNo !== undefined && input.lotNo !== existing.lotNo) ||
        (input.segmentNo !== undefined && input.segmentNo !== existing.segmentNo);

      if (identifierChanged) {
        // Bag/segment/batch numbers are the physical identifiers used to
        // trace this donation's units through separation. Once separation
        // has started (any unit for this donation has moved past the raw
        // COLLECTED state), changing them would desynchronize the paper
        // trail from the system record — refuse.
        const separationStarted = await BloodUnitModel.exists({
          donationId: existing.donationId,
          status: { $ne: 'COLLECTED' },
        });
        if (separationStarted) {
          throw new ConflictError(
            'Bag/segment/batch number cannot be changed once component separation has started for this donation',
          );
        }
      }

      await deps.donations.update(
        id,
        {
          collectedAt: input.collectedAt,
          bagNo: input.bagNo,
          segmentNo: input.segmentNo,
          lotNo: input.lotNo,
          notes: input.notes,
          phlebotomistId: input.phlebotomistId,
        },
        actorId,
      );

      log.info({ donationId: id, actorId, fields: Object.keys(input) }, 'donation updated');
      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'UPDATE',
          entityType: 'Donation',
          entityId: id,
          entityLabel: existing.donationId,
        },
        {
          bagNo: existing.bagNo,
          segmentNo: existing.segmentNo,
          lotNo: existing.lotNo,
          collectedAt: existing.collectedAt,
          notes: (existing as unknown as { notes?: string }).notes,
        },
        input,
      );

      const updated = await deps.donations.findById(id);
      if (!updated) throw new NotFoundError('Donation', id);
      return updated;
    },

    // ── Inward Donation (bag-first) ──

    async createInward(input, actorId) {
      const collectedAt = mergeDateTime(input.collectionDate, input.collectionTime);
      const donationPublicId = generateDonationId(collectedAt);

      const units = deriveUnits({
        donationId: donationPublicId,
        bagNo: input.bagNo,
        donationType: input.donationType,
        collectedAt,
      });

      const created = await deps.donations.createInwardAtomic({
        donationPublicId,
        bagNo: input.bagNo,
        lotNo: input.lotNo,
        segmentNo: input.segmentNo,
        collectedAt,
        donationType: input.donationType,
        provisionalBloodGroup: input.provisionalBloodGroup,
        units,
        campId: input.source === 'camp' ? input.campId : undefined,
        actorId,
      });

      log.info(
        {
          donationId: donationPublicId,
          bagNo: input.bagNo,
          unitCount: units.length,
          actorId,
        },
        'inward (bag-first) donation registered',
      );

      await linkBagIssueUsed(deps, log, {
        bagNo: input.bagNo,
        donationId: created.id,
        segmentNo: input.segmentNo,
        actorId,
      });

      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'CREATE',
          entityType: 'Donation',
          entityId: created.id,
          entityLabel: donationPublicId,
        },
        undefined,
        {
          donationId: donationPublicId,
          registrationMode: 'INWARD',
          bagNo: input.bagNo,
          provisionalBloodGroup: input.provisionalBloodGroup,
          unitCount: units.length,
        },
      );

      if (units.length > 0) {
        void notificationCenterService
          .notify({
            title: 'Inward bag registered',
            message: `Bag ${input.bagNo} registered as ${donationPublicId} — donor identity pending`,
            module: 'COLLECTION',
            category: 'INWARD_DONATION_PENDING',
            severity: 'WARNING',
            relatedRecordId: created.id,
            relatedRecordType: 'Donation',
            actionLink: `/master-register/donations`,
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
            actionLink: `/component/separate`,
            dedupeKey: `COMPONENT_SEPARATION_PENDING:${created.id}`,
          })
          .catch(() => undefined);
      }

      return created;
    },

    async linkDonor(donationId, input, actorId) {
      const state = await deps.donations.findInwardState(donationId);
      if (!state) throw new NotFoundError('Donation', donationId);
      if (state.completionStatus !== 'BAG_ONLY' && state.completionStatus !== 'DONOR_PENDING') {
        throw new ConflictError(
          `Donation ${donationId} is not awaiting a donor link (status: ${state.completionStatus})`,
        );
      }
      if (state.donor) {
        throw new ConflictError(`Donation ${donationId} already has a linked donor`);
      }

      let donorId: string;
      if ('existingDonorId' in input) {
        const donor = await deps.donors.findById(input.existingDonorId);
        if (!donor) throw new NotFoundError('Donor', input.existingDonorId);
        donorId = donor.id;
      } else {
        if (!deps.donorService) {
          throw new AppError(
            'INTERNAL_ERROR',
            'Donor creation path not wired for this donation service instance',
            500,
          );
        }
        // Full donor create — eligibility validation (age/weight) runs
        // untouched inside donor.service.ts register().
        const donor = await deps.donorService.register(input, actorId);
        donorId = donor.id;
      }

      const nextStatus = nextInwardStatus(true, state.hasMedicalHistory);
      await deps.donations.setDonor(donationId, donorId, nextStatus, actorId);

      log.info({ donationId, donorId, actorId, nextStatus }, 'donor linked to inward donation');
      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'UPDATE',
          entityType: 'Donation',
          entityId: donationId,
          entityLabel: state.donationId,
        },
        { donor: null, completionStatus: state.completionStatus },
        { donor: donorId, completionStatus: nextStatus },
      );

      const updated = await deps.donations.findById(donationId);
      if (!updated) throw new NotFoundError('Donation', donationId);
      return updated;
    },

    async saveMedicalHistory(donationId, input, actorId) {
      const state = await deps.donations.findInwardState(donationId);
      if (!state) throw new NotFoundError('Donation', donationId);
      if (state.completionStatus === 'COMPLETE') {
        throw new ConflictError(`Donation ${donationId} is already complete`);
      }

      const nextStatus = nextInwardStatus(Boolean(state.donor), true);
      await deps.donations.setMedicalHistory(
        donationId,
        { medicalExam: input.medicalExam, questionnaireFlags: input.questionnaireFlags },
        nextStatus,
        actorId,
      );

      log.info({ donationId, actorId, nextStatus }, 'medical history saved for inward donation');
      void withAudit(
        { actorId },
        {
          module: 'donation',
          action: 'UPDATE',
          entityType: 'Donation',
          entityId: donationId,
          entityLabel: state.donationId,
        },
        { completionStatus: state.completionStatus },
        { completionStatus: nextStatus },
      );

      const updated = await deps.donations.findById(donationId);
      if (!updated) throw new NotFoundError('Donation', donationId);
      return updated;
    },

    async finalizeInward(donationId, input, actorId) {
      const state = await deps.donations.findInwardState(donationId);
      if (!state) throw new NotFoundError('Donation', donationId);
      if (!state.donor) {
        throw new ConflictError(
          `Donation ${donationId} needs a linked donor before it can be finalized`,
        );
      }

      const donation = await deps.donations.findById(donationId);
      if (!donation) throw new NotFoundError('Donation', donationId);

      const donor = await deps.donors.findById(state.donor);
      if (!donor) throw new NotFoundError('Donor', state.donor);

      const medicalExam = input.medicalExam ?? donation.medicalExam;

      const [latestDonation, activeDeferrals] = await Promise.all([
        deps.donations.findLatestByDonor(state.donor),
        deps.deferrals.findActiveByDonor(state.donor, new Date()),
      ]);

      const eligibility = checkEligibility({
        donor: {
          ageYears: yearsBetween(new Date(donor.dob), new Date()),
          weightKg: (medicalExam as { weightKg?: number } | undefined)?.weightKg ?? donor.weightKg,
          sex: donor.sex,
          hbGdl: (medicalExam as { hbGdl?: number } | undefined)?.hbGdl,
          pulseBpm: (medicalExam as { pulseBpm?: number } | undefined)?.pulseBpm,
          temperatureCelsius: (medicalExam as { temperatureCelsius?: number } | undefined)
            ?.temperatureCelsius,
          bloodPressure: (
            medicalExam as { bloodPressure?: { systolic: number; diastolic: number } } | undefined
          )?.bloodPressure,
          lastDonationDate: latestDonation?.collectedAt,
          lastDonationType: latestDonation?.donationType as
            | CreateDonationInput['donationType']
            | undefined,
          activeDeferrals,
        },
        proposedDonationType: donation.donationType as CreateDonationInput['donationType'],
        now: new Date(),
      });

      const isFit = input.donorFitness.isFit && eligibility.eligible;

      if (isFit) {
        await deps.donations.setMedicalHistory(
          donationId,
          { medicalExam: input.medicalExam ?? medicalExam },
          'COMPLETE',
          actorId,
        );
        log.info({ donationId, actorId }, 'inward donation finalized as COMPLETE');
        void withAudit(
          { actorId },
          {
            module: 'donation',
            action: 'UPDATE',
            entityType: 'Donation',
            entityId: donationId,
            entityLabel: state.donationId,
          },
          { completionStatus: state.completionStatus },
          { completionStatus: 'COMPLETE' },
        );
      } else {
        // Eligibility (or manual fitness) failed — route through the
        // deferral module instead of throwing an unhandled 500, mirroring
        // the TTI-reactive deferral pattern in tti.service.ts.
        const reasons = input.donorFitness.isFit
          ? eligibility.reasons
          : [input.donorFitness.rejectionReason ?? 'Marked unfit at inward finalize'];
        await deps.deferrals.create(
          {
            donor: state.donor,
            type: 'TEMPORARY',
            reason: `Inward donation finalize failed: ${reasons.join(', ')}`,
            source: 'VITALS',
            relatedDonationId: state.donationId,
          },
          actorId,
        );
        log.warn(
          { donationId, actorId, reasons },
          'inward donation failed finalize eligibility — deferral raised, not completed',
        );
        void withAudit(
          { actorId },
          {
            module: 'donation',
            action: 'UPDATE',
            entityType: 'Donation',
            entityId: donationId,
            entityLabel: state.donationId,
            severity: 'warning',
          },
          { completionStatus: state.completionStatus },
          { completionStatus: state.completionStatus, deferred: true, reasons },
        );
      }

      const updated = await deps.donations.findById(donationId);
      if (!updated) throw new NotFoundError('Donation', donationId);
      return updated;
    },

    async listIncomplete(query) {
      const { items, total } = await deps.donations.listIncomplete(query);
      return { items, total, page: query.page, pageSize: query.pageSize };
    },

    async permanentDelete(id, actorId, reason) {
      const status = await deps.donations.findRawStatus(id);
      if (!status) throw new NotFoundError('Donation', id);
      if (!status.deletedAt) {
        throw new ConflictError(
          'Donation must be soft-deleted before it can be permanently deleted',
        );
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

// Shared by register() and createInward() — marks the physical BagIssue
// (procurement module) that this bag came from as USED once a donation
// event has been recorded against it. Best-effort: a missing/failed
// BagIssue lookup must never fail the donation write itself.
async function linkBagIssueUsed(
  deps: { bagIssues?: BagIssueRepo },
  log: ReturnType<typeof childLogger>,
  params: {
    bagNo?: string;
    donorId?: string;
    donationId: string;
    segmentNo?: string;
    actorId: string;
  },
): Promise<void> {
  if (!params.bagNo || !deps.bagIssues) return;
  try {
    const bagIssue = await deps.bagIssues.findBySerialNumber(params.bagNo);
    if (bagIssue) {
      await deps.bagIssues.updateStatus(
        bagIssue.id,
        {
          status: 'USED',
          donorId: params.donorId,
          donationId: params.donationId,
          segmentNo: params.segmentNo,
          usedAt: new Date(),
        },
        params.actorId,
      );
      log.info(
        { bagSerialNumber: params.bagNo, donationId: params.donationId },
        'BagIssue marked as USED',
      );
    }
  } catch (err) {
    log.error({ err: (err as Error).message }, 'Failed to mark BagIssue as USED');
  }
}

// Combines a date-only value with an "HH:mm" time-of-day string. When no
// time is given, the date is used as-is (its own time component, if any).
function mergeDateTime(date: Date, time?: string): Date {
  if (!time) return date;
  const [hhRaw, mmRaw] = time.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  const merged = new Date(date);
  if (!Number.isNaN(hh) && !Number.isNaN(mm)) merged.setHours(hh, mm, 0, 0);
  return merged;
}

// Inward Donation completionStatus is named after the single next
// outstanding prerequisite before the donation can be finalized —
// BAG_ONLY only ever applies at creation. Once any progress is made,
// the status names whichever of {donor, medical+exam-fitness} is still
// outstanding, prioritizing donor first since medical history logically
// depends on knowing who the donor is. Never regresses and never
// returns COMPLETE — only finalizeInward() sets that, after eligibility
// passes.
function nextInwardStatus(
  hasDonor: boolean,
  hasMedicalHistory: boolean,
): 'DONOR_PENDING' | 'MEDICAL_PENDING' {
  if (!hasDonor) return 'DONOR_PENDING';
  // Even if medical history is already present, MEDICAL_PENDING also
  // covers "awaiting finalizeInward()" — there is no separate status for
  // that step, and exam-fitness data is supplied to finalizeInward
  // directly regardless of whether saveMedicalHistory ran first.
  return 'MEDICAL_PENDING';
}
