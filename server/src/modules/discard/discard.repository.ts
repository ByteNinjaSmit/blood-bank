// Clinical BloodUnit discard register — distinct from the procurement
// `bag-discard` module (which discards empty/damaged bags before use).
// No model of its own: reads/writes BloodUnit/Donation/TtiResult owned
// by their respective modules, same shape as `mis`/`component`.
import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { invalidate } from '@/core/cache';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { toLegacyComponentType } from '@/modules/component/component.mapper';

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
  list(
    filters: DiscardListFilters,
  ): Promise<{ data: any[]; total: number; totalPages: number }>;
  create(input: DiscardCreateInput): Promise<{ unitsDiscarded: number; bagNo: string }>;
}

export function createDiscardRepo(): DiscardRepo {
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
          componentId: u.unitId,
          componentType: toLegacyComponentType(u.componentType),
          itemType: u.componentType === 'WHOLE_BLOOD' ? 'Bag' : 'Component',
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
      if (units.length === 0) throw new NotFoundError('Blood units for donation', donation.donationId);

      const actorObjId = new Types.ObjectId(actorId);

      for (const unit of units) {
        const oldStatus = unit.status;
        unit.status = 'DISCARDED';
        unit.discardReason = reason as any;
        unit.discardNotes = description || undefined;
        unit.reservedFor = null as any;
        unit.reservedUntil = null as any;
        unit.reservedAt = null as any;

        unit.statusHistory.push({
          from: oldStatus,
          to: 'DISCARDED',
          event: 'MANUAL_DISCARD',
          actor: actorObjId,
          at: new Date(),
          reason: `Manually discarded via procurement portal. Description: ${description || 'N/A'}. Segment: ${segmentNo || donation.segmentNo || 'N/A'}, Batch: ${batchNo || donation.lotNo || 'N/A'}`,
        } as any);
        await unit.save();

        const reqs = await RequisitionModel.find({ 'matchedUnits.unitId': unit.unitId });
        for (const r of reqs) {
          r.matchedUnits = r.matchedUnits.filter((mu: any) => mu.unitId !== unit.unitId) as any;
          if (r.matchedUnits.length === 0 && ['MATCHED', 'CROSSMATCHED', 'APPROVED'].includes(r.status)) {
            r.status = 'PENDING';
          }
          await r.save();
        }
      }

      if (reason === 'TTI_POSITIVE' && ttiResults) {
        const testsArray = [
          { testName: 'HIV', method: 'ELISA', result: ttiResults.HIV || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
          { testName: 'HBSAG', method: 'ELISA', result: ttiResults.HBSAG || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
          { testName: 'HCV', method: 'ELISA', result: ttiResults.HCV || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
          { testName: 'SYPHILIS', method: 'ELISA', result: ttiResults.SYPHILIS || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
          { testName: 'MALARIA', method: 'ELISA', result: ttiResults.MALARIA || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
        ];

        const existingTti = await TtiResultModel.findOne({ donationId: donation.donationId });
        if (existingTti) {
          existingTti.tests = testsArray as any;
          existingTti.releaseDecision = 'reactive';
          existingTti.updatedBy = actorObjId;
          await existingTti.save();
        } else {
          await TtiResultModel.create({
            donationId: donation.donationId,
            tests: testsArray,
            releaseDecision: 'reactive',
            createdBy: actorObjId,
            updatedBy: actorObjId,
          });
        }
      }

      if (segmentNo) donation.segmentNo = segmentNo;
      if (batchNo) donation.lotNo = batchNo;
      await donation.save();

      await invalidate('inventory:*');

      return { unitsDiscarded: units.length, bagNo };
    },
  };
}
