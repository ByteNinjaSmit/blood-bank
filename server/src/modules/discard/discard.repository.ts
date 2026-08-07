// Clinical BloodUnit discard register — distinct from the procurement
// `bag-discard` module (which discards empty/damaged bags before use).
// No model of its own: reads/writes BloodUnit/Donation/TtiResult owned
// by their respective modules, same shape as `mis`/`component`.
import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { invalidate } from '@/core/cache';
import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors';
import { cascadeRestore, runInCascadeTransaction } from '@/shared/utils/cascade-delete';
import { donationNode, donorCascadeNode } from '@/shared/cascade-registry';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { TtiService } from '@/modules/tti/tti.service';
import type { TtiTestEntryInput } from '@/modules/tti/tti.repository';
import type { TtiResult } from '@/shared/enums';

export interface DiscardListFilters {
  page?: number;
  limit?: number;
  search?: string;
  itemType?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface DiscardCreateInput {
  bagNo: string;
  batchNo?: string;
  segmentNo?: string;
  reason: string;
  description?: string;
  ttiResults?: Record<string, string>;
  actorId: string;
}

export interface DiscardRepo {
  list(filters: DiscardListFilters): Promise<{ data: any[]; total: number; totalPages: number }>;
  create(input: DiscardCreateInput): Promise<{ unitsDiscarded: number; bagNo: string }>;
  /**
   * Undo a unit that was auto-DISCARDED as a side effect of cascade-deleting
   * its upstream donation/donor (see cascade-registry.ts bloodUnitNode) —
   * restores the whole batch it was deleted with (donor or donation,
   * whichever was the actual root), not just this one unit in isolation.
   */
  restoreCascadeDiscarded(
    unitId: string,
    actorId: string,
  ): Promise<{ restoredScope: 'donor' | 'donation' }>;
}

export function createDiscardRepo(deps: { units: UnitRepo; ttiService: TtiService }): DiscardRepo {
  return {
    async list(filters) {
      const { page, limit, search, fromDate, toDate, sortBy, order } = filters;

      const unitFilter: any = {
        status: 'DISCARDED',
        $and: [{ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }],
      };

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingDonations = await DonationModel.find({
          $and: [
            { $or: [{ donationId: searchRegex }, { bagNo: searchRegex }] },
            { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
          ],
        })
          .select('donationId')
          .lean();
        const matchedDonationIds = matchingDonations.map((d) => d.donationId);
        unitFilter.$and.push({
          $or: [
            { donationId: { $in: matchedDonationIds } },
            { donationId: searchRegex },
            { unitId: searchRegex },
          ],
        });
      }

      if (fromDate || toDate) {
        unitFilter.updatedAt = {};
        if (fromDate) unitFilter.updatedAt.$gte = new Date(fromDate);
        if (toDate) unitFilter.updatedAt.$lte = new Date(toDate);
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skipNum = (pageNum - 1) * limitNum;
      const sortDir = order === 'asc' ? 1 : -1;
      let sortField = sortBy || 'updatedAt';
      if (sortField === 'discardedAt') sortField = 'updatedAt';

      const total = await BloodUnitModel.countDocuments(unitFilter);
      const units = await BloodUnitModel.find(unitFilter)
        .sort({ [sortField]: sortDir })
        .skip(skipNum)
        .limit(limitNum)
        .lean();

      const donationIds = units.map((u) => u.donationId).filter(Boolean);
      const donations = await DonationModel.find({
        donationId: { $in: donationIds },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
        .populate('donor')
        .populate('campId')
        .lean();
      const ttis = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();

      const donationMap = new Map<string, any>();
      donations.forEach((d) => {
        if (d.donationId) donationMap.set(d.donationId, d);
      });
      const ttiMap = new Map<string, any>();
      ttis.forEach((t) => {
        if (t.donationId) ttiMap.set(t.donationId, t);
      });

      const data = units.map((u) => {
        const discardHistory = u.statusHistory?.find((h) => h.to === 'DISCARDED');
        const donation = donationMap.get(u.donationId);
        const donor = donation?.donor as any;
        const tti = ttiMap.get(u.donationId);

        let testResultsStr = 'No tests performed';
        if (tti && tti.tests && tti.tests.length > 0) {
          testResultsStr = tti.tests
            .map((t: any) => {
              let tName = t.testName;
              if (tName === 'HBSAG') tName = 'HBsAg';
              else if (tName === 'SYPHILIS') tName = 'VDRL';
              else if (tName === 'MALARIA') tName = 'MP';

              let result = t.result;
              if (result === 'NEGATIVE') result = 'Negative';
              else if (result === 'REACTIVE') result = 'Reactive';
              else if (result === 'INDETERMINATE') result = 'Indeterminate';

              return `${tName}: ${result}`;
            })
            .join(', ');
        } else if (tti) {
          testResultsStr = `Release Decision: ${tti.releaseDecision}`;
        }

        return {
          id: u._id.toString(),
          bagNo: donation?.bagNo || u.donationId,
          segmentNo: donation?.segmentNo || '',
          componentId: u.unitId,
          componentType: u.componentType,
          itemName: u.componentType === 'WB' ? 'Whole Blood' : u.componentType,
          itemType: u.componentType === 'WB' ? 'Bag' : 'Component',
          reason: u.discardReason || 'QC_FAIL',
          description: u.discardNotes || '',
          discardedAt: discardHistory ? discardHistory.at.toISOString() : u.updatedAt.toISOString(),
          itemId: u.unitId,
          siteId: donation?.campId ? (donation.campId as any).name : 'In-House',
          createdAt: u.createdAt.toISOString(),
          segmentId: u.unitDin || u.unitId,
          collectionDate: donation?.collectedAt
            ? donation.collectedAt.toISOString()
            : u.collectedAt.toISOString(),
          expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
          status: 'DISCARDED',
          initialVitals: {
            bp: donation?.medicalExam?.bloodPressure
              ? `${donation.medicalExam.bloodPressure.systolic}/${donation.medicalExam.bloodPressure.diastolic}`
              : 'N/A',
            hb: donation?.medicalExam?.hbGdl ?? 'N/A',
            weightKg: donation?.medicalExam?.weightKg ?? 'N/A',
            pulse: donation?.medicalExam?.pulseBpm ?? 'N/A',
            tempC: donation?.medicalExam?.temperatureCelsius ?? 'N/A',
          },
          donorId: donor?.donorId || 'N/A',
          firstName: donor?.name?.firstName || 'N/A',
          middleName: donor?.name?.middleName || '',
          lastName: donor?.name?.lastName || 'N/A',
          dob: donor?.dob
            ? donor.dob instanceof Date
              ? donor.dob.toISOString().slice(0, 10)
              : new Date(donor.dob).toISOString().slice(0, 10)
            : 'N/A',
          sex: donor?.sex || 'N/A',
          phone: donor?.phone || 'N/A',
          email: donor?.email || 'N/A',
          bloodGroup: donor?.bloodGroup || 'N/A',
          rh: donor?.rh === 'NEGATIVE' ? 'Negative' : 'Positive',
          testResults: testResultsStr,
        };
      });

      return { data, total, totalPages: Math.ceil(total / limitNum) };
    },

    async create({ bagNo, batchNo, segmentNo, reason, description, ttiResults, actorId }) {
      const donation = await DonationModel.findOne({
        $or: [{ donationId: bagNo }, { bagNo }],
        deletedAt: null,
      });
      if (!donation) throw new NotFoundError('Donation matching bag number', bagNo);

      const units = await BloodUnitModel.find({ donationId: donation.donationId, deletedAt: null });
      if (units.length === 0)
        throw new NotFoundError('Blood units for donation', donation.donationId);

      const manualDiscardReason = `Manually discarded via procurement portal. Description: ${description || 'N/A'}. Segment: ${segmentNo || donation.segmentNo || 'N/A'}, Batch: ${batchNo || donation.lotNo || 'N/A'}`;

      if (reason === 'TTI_POSITIVE' && ttiResults) {
        // Delegate the whole panel + cascade to the guarded TTI service
        // (merge-preserving test recording, state-machine DISCARD, donor
        // deferral, lookback, BagStock, notification) so this manual
        // entry point produces the exact same side effects as the
        // Serology screen instead of a divergent, partial copy.
        const mappedTests: TtiTestEntryInput[] = (
          ['HIV', 'HBSAG', 'HCV', 'SYPHILIS', 'MALARIA'] as const
        ).map((testName) => ({
          testName,
          method: 'ELISA',
          result: (ttiResults[testName] as TtiResult) || 'NEGATIVE',
          performedAt: new Date(),
        }));
        await deps.ttiService.recordAndFinalize(donation.donationId, mappedTests, actorId);
      } else {
        for (const unit of units) {
          await deps.units.applyEvent({
            unitId: unit.unitId,
            event: 'DISCARD',
            actorId,
            reason: manualDiscardReason,
            set: {
              discardReason: reason,
              reservedFor: null,
              reservedAt: null,
              reservedUntil: null,
            } as any,
          });
        }
      }

      for (const unit of units) {
        const reqs = await RequisitionModel.find({ 'matchedUnits.unitId': unit.unitId });
        for (const r of reqs) {
          r.matchedUnits = r.matchedUnits.filter((mu: any) => mu.unitId !== unit.unitId) as any;
          if (
            r.matchedUnits.length === 0 &&
            ['MATCHED', 'CROSSMATCHED', 'APPROVED'].includes(r.status)
          ) {
            r.status = 'PENDING';
          }
          await r.save();
        }
      }

      if (segmentNo) donation.segmentNo = segmentNo;
      if (batchNo) donation.lotNo = batchNo;
      await donation.save();

      await invalidate('inventory:*');

      return { unitsDiscarded: units.length, bagNo };
    },

    async restoreCascadeDiscarded(unitId, actorId) {
      const unit = await BloodUnitModel.findOne({ unitId, status: 'DISCARDED' });
      if (!unit) throw new NotFoundError('Discarded blood unit', unitId);
      if (unit.affected) {
        throw new ConflictError(
          'This unit is preserved as an affected record (already part of a completed downstream workflow) and cannot be auto-restored — review it from the Recycle Bin instead.',
        );
      }
      if (!unit.deleteBatchId) {
        throw new ConflictError(
          'This unit was not discarded by a cascade delete of its donation/donor, so it cannot be restored from here.',
        );
      }

      const donation = await DonationModel.findOne({ donationId: unit.donationId });
      if (!donation) throw new NotFoundError('Donation for unit', unit.donationId);

      const donor = await DonorModel.findById(donation.donor);
      const rootWasDonor = Boolean(
        donor && donor.deletedAt && donor.deleteBatchId === unit.deleteBatchId,
      );

      await runInCascadeTransaction((session) =>
        rootWasDonor
          ? cascadeRestore(donorCascadeNode, donor!._id.toString(), actorId, session)
          : cascadeRestore(donationNode, donation._id.toString(), actorId, session),
      );

      await invalidate('inventory:*');

      return { restoredScope: rootWasDonor ? 'donor' : 'donation' };
    },
  };
}
