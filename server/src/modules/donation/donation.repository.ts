// Donation repository. Writes to the NEW donations / bloodunits /
// ttiresults collections. Reads from the same. Legacy `bloodbags`
// collection is untouched by this repo — the cutover migration script
// keeps the two in sync.

import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import type {
  CreateDonationInput,
  ListDonationsInput,
} from '@/modules/donation/donation.validator';
import type { DerivedUnit } from '@/modules/donation/donation.unit-derivation';
import { NotFoundError } from '@/shared/errors';

export interface DonationDto {
  id: string;
  donationId: string;
  bagNo?: string | null;
  segmentNo?: string | null;
  lotNo?: string | null;
  donor: string;
  donorName?: string;
  donationType: string;
  typeOfBag?: string;
  collectedAt: string;
  bloodGroup: string;
  rhFactor: string;
  unitCount: number;
  campId?: string;
  camp?: { id: string; name: string; address?: string };
  isFit?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  components?: Array<{ componentType: string; volumeMl: number; status: string }>;
  ttiTests?: {
    HIV: string | null;
    HBSAG: string | null;
    HCV: string | null;
    SYPHILIS: string | null;
    MALARIA: string | null;
  };
  ttiReason?: string | null;
}

export interface DonationWithUnitsDto extends DonationDto {
  donorFitness?: { isFit: boolean; rejectionReason?: string; rejectedAtStep?: string };
  medicalExam?: Record<string, unknown>;
  units: Array<{
    unitId: string;
    componentType: string;
    volumeMl: number;
    expiresAt: string;
    status: string;
  }>;
  ttiResultId?: string;
  ttiReleaseDecision?: string;
  requisitions?: any[];
}

interface CreateInput {
  input: CreateDonationInput;
  donationPublicId: string;
  units: DerivedUnit[];
  actorId: string;
}

export interface DonationRepo {
  createAtomic(c: CreateInput): Promise<DonationWithUnitsDto>;
  findById(id: string): Promise<DonationWithUnitsDto | null>;
  findRawStatus(id: string): Promise<{ deletedAt: Date | null } | null>;
  list(q: ListDonationsInput): Promise<{ items: DonationDto[]; total: number }>;
  findLatestByDonor(donorId: string): Promise<{ collectedAt: Date; donationType: string } | null>;
  softDelete(id: string, actorId: string): Promise<void>;
  restore(id: string, actorId: string): Promise<void>;
  delete(id: string): Promise<void>;
  /** Batch/segment lookup by bag number, for the discard-entry form. */
  lookupByBagNo(bagNo: string): Promise<{ lotNo: string; segmentNo: string } | null>;
  /** Map of donationId -> bagNo (falls back to donationId) for a set of donations. */
  bagNosByDonationIds(donationIds: string[]): Promise<Record<string, string>>;
}

export function createDonationRepo(): DonationRepo {
  return {
    async createAtomic({ input, donationPublicId, units, actorId }) {
      const actor = new Types.ObjectId(actorId);
      const donorObjId = new Types.ObjectId(input.donor);
      const campId = input.campId ? new Types.ObjectId(input.campId) : undefined;
      const phlebotomistId = input.phlebotomistId
        ? new Types.ObjectId(input.phlebotomistId)
        : actor;

      // Per rebuild contract, dual-write would normally happen here.
      // The donation/unit/tti collections are NEW; nothing dual-writes
      // to bloodbags. The legacy /api/donation continues to write
      // bloodbags directly. The migration script reconciles.
      try {
        const session = await DonationModel.startSession();
        try {
          let result!: DonationWithUnitsDto;
          await session.withTransaction(async () => {
            const [donation] = await DonationModel.create(
              [
                {
                  donationId: donationPublicId,
                  donor: donorObjId,
                  donationType: input.donationType,
                  collectedAt: input.collectedAt,
                  campId,
                  phlebotomistId,
                  medicalExam: input.medicalExam,
                  donorFitness: input.donorFitness,
                  questionnaireFlags: input.questionnaireFlags
                    ? new Map(Object.entries(input.questionnaireFlags))
                    : undefined,
                  typeOfBag: input.typeOfBag || 'SB',
                  notes: input.notes,
                  bagNo: input.bagNo,
                  segmentNo: input.segmentNo,
                  lotNo: input.lotNo,
                  createdBy: actor,
                  updatedBy: actor,
                },
              ],
              { session },
            );
            if (!donation) throw new Error('Failed to create donation');

            // Donor.lastDonationDate is intentionally left untouched here —
            // it holds the historical value entered at donor registration,
            // not an auto-tracked "most recent donation" pointer. The
            // actual most recent in-system donation is read straight off
            // the Donation collection (see donor.repository's
            // populateLastDonationId -> recentDonationDate) so the two
            // never collide in the UI.

            const unitDocs = await BloodUnitModel.insertMany(
              units.map((u) => ({
                unitId: u.unitId,
                productCode: u.productCode,
                donationId: donationPublicId,
                componentType: u.componentType,
                aboGroup: input.bloodGroup,
                rhFactor: input.rhFactor,
                volumeMl: u.volumeMl,
                collectedAt: u.collectedAt,
                expiresAt: u.expiresAt,
                status: 'COLLECTED',
                statusHistory: [
                  {
                    to: 'COLLECTED',
                    event: 'CREATE',
                    actor,
                    at: new Date(),
                  },
                ],
                campId,
                createdBy: actor,
                updatedBy: actor,
              })),
              { session },
            );

            const [tti] = await TtiResultModel.create(
              [
                {
                  donationId: donationPublicId,
                  aboGroupConfirmed: input.bloodGroup,
                  rhFactorConfirmed: input.rhFactor,
                  tests: [],
                  releaseDecision: 'pending',
                  createdBy: actor,
                  updatedBy: actor,
                },
              ],
              { session },
            );

            result = {
              id: donation!._id.toString(),
              donationId: donationPublicId,
              donor: input.donor,
              donationType: input.donationType,
              collectedAt: input.collectedAt.toISOString(),
              bloodGroup: input.bloodGroup,
              rhFactor: input.rhFactor,
              unitCount: unitDocs.length,
              bagNo: donation.bagNo,
              segmentNo: donation.segmentNo,
              lotNo: donation.lotNo,
              createdAt: (donation as unknown as { createdAt: Date }).createdAt.toISOString(),
              updatedAt: (donation as unknown as { updatedAt: Date }).updatedAt.toISOString(),
              units: unitDocs.map((u) => ({
                unitId: u.unitId,
                componentType: u.componentType,
                volumeMl: u.volumeMl,
                expiresAt: u.expiresAt.toISOString(),
                status: u.status,
              })),
              ttiResultId: tti!._id.toString(),
              ttiReleaseDecision: 'pending',
            };
          });
          return result;
        } finally {
          await session.endSession();
        }
      } catch (err: any) {
        // Fallback (no-transaction) path
        const [donation] = await DonationModel.create(
          [
            {
              donationId: donationPublicId,
              donor: donorObjId,
              donationType: input.donationType,
              collectedAt: input.collectedAt,
              campId,
              phlebotomistId,
              medicalExam: input.medicalExam,
              donorFitness: input.donorFitness,
              questionnaireFlags: input.questionnaireFlags
                ? new Map(Object.entries(input.questionnaireFlags))
                : undefined,
              typeOfBag: input.typeOfBag || 'SB',
              notes: input.notes,
              bagNo: input.bagNo,
              segmentNo: input.segmentNo,
              lotNo: input.lotNo,
              createdBy: actor,
              updatedBy: actor,
            },
          ]
        );
        if (!donation) throw new Error('Failed to create donation');

        // Donor.lastDonationDate is intentionally left untouched here too —
        // see the matching comment in the transactional path above.

        const unitDocs = await BloodUnitModel.insertMany(
          units.map((u) => ({
            unitId: u.unitId,
            productCode: u.productCode,
            donationId: donationPublicId,
            componentType: u.componentType,
            aboGroup: input.bloodGroup,
            rhFactor: input.rhFactor,
            volumeMl: u.volumeMl,
            collectedAt: u.collectedAt,
            expiresAt: u.expiresAt,
            status: 'COLLECTED',
            statusHistory: [
              {
                to: 'COLLECTED',
                event: 'CREATE',
                actor,
                at: new Date(),
              },
            ],
            campId,
            createdBy: actor,
            updatedBy: actor,
          })),
        );

        const [tti] = await TtiResultModel.create(
          [
            {
              donationId: donationPublicId,
              aboGroupConfirmed: input.bloodGroup,
              rhFactorConfirmed: input.rhFactor,
              tests: [],
              releaseDecision: 'pending',
              createdBy: actor,
              updatedBy: actor,
            },
          ]
        );

        return {
          id: donation!._id.toString(),
          donationId: donationPublicId,
          donor: input.donor,
          donationType: input.donationType,
          collectedAt: input.collectedAt.toISOString(),
          bloodGroup: input.bloodGroup,
          rhFactor: input.rhFactor,
          unitCount: unitDocs.length,
          bagNo: donation.bagNo,
          segmentNo: donation.segmentNo,
          lotNo: donation.lotNo,
          createdAt: (donation as unknown as { createdAt: Date }).createdAt.toISOString(),
          updatedAt: (donation as unknown as { updatedAt: Date }).updatedAt.toISOString(),
          units: unitDocs.map((u) => ({
            unitId: u.unitId,
            componentType: u.componentType,
            volumeMl: u.volumeMl,
            expiresAt: u.expiresAt.toISOString(),
            status: u.status,
          })),
          ttiResultId: tti!._id.toString(),
          ttiReleaseDecision: 'pending',
        };
      }
    },

    async findById(id) {
      const doc = await DonationModel.findById(id)
        .populate<{ donor: { _id: Types.ObjectId; name?: { firstName?: string; middleName?: string; lastName?: string } } }>('donor', 'name')
        .populate<{ campId?: { _id: Types.ObjectId; name?: string; address?: string } }>('campId', 'name address')
        .lean();
      if (!doc) return null;
      const donorDoc = doc.donor as unknown as { _id: Types.ObjectId; name?: { firstName?: string; middleName?: string; lastName?: string } };
      const campDoc = doc.campId as unknown as { _id: Types.ObjectId; name?: string; address?: string } | undefined;
      const [units, tti] = await Promise.all([
        BloodUnitModel.find({ donationId: doc.donationId })
          .select('unitId componentType volumeMl expiresAt status aboGroup rhFactor')
          .lean(),
        TtiResultModel.findOne({ donationId: doc.donationId }).select('_id releaseDecision aboGroupConfirmed rhFactorConfirmed').lean(),
      ]);

      const unitIds = units.map(u => u.unitId);

      const requisitions = await RequisitionModel.find({
        'matchedUnits.unitId': { $in: unitIds },
        deletedAt: null
      })
      .populate('hospitalId')
      .populate('patientId')
      .lean();

      const issues = await IssueModel.find({
        unitId: { $in: unitIds }
      }).lean();

      const requisitionsInfo = units.map(u => {
        const req = requisitions.find(r => r.matchedUnits.some(mu => mu.unitId === u.unitId));
        const issue = issues.find(i => i.unitId === u.unitId);
        const hospital = req?.hospitalId as any;
        const patient = req?.patientId as any;

        return {
          unitId: u.unitId,
          componentType: u.componentType,
          status: u.status,
          aboGroup: u.aboGroup,
          rhFactor: u.rhFactor,
          expiresAt: u.expiresAt ? u.expiresAt.toISOString() : '',
          requisitionId: req?.requisitionId || undefined,
          requisitionDbId: req?._id?.toString() || undefined,
          hospitalName: hospital?.name || undefined,
          patientName: patient?.name || undefined,
          clinicianName: req?.clinicianName || undefined,
          requiredAt: req?.requiredAt ? req.requiredAt.toISOString() : undefined,
          requisitionStatus: req?.status || undefined,
          issue: issue ? {
            issueId: issue.issueId,
            issuedAt: issue.issuedAt.toISOString(),
            collectedByName: issue.collectedByName || undefined,
          } : null,
        };
      });

      return {
        id: doc._id.toString(),
        donationId: doc.donationId,
        donor: donorDoc?._id?.toString() ?? doc.donor?.toString() ?? '',
        donorName: donorDoc?.name
          ? [donorDoc.name.firstName, donorDoc.name.middleName, donorDoc.name.lastName].filter(Boolean).join(' ')
          : undefined,
        donationType: doc.donationType,
        typeOfBag: doc.typeOfBag,
        bagNo: doc.bagNo,
        segmentNo: doc.segmentNo,
        lotNo: doc.lotNo,
        collectedAt: doc.collectedAt.toISOString(),
        bloodGroup: tti?.aboGroupConfirmed ?? '',
        rhFactor: tti?.rhFactorConfirmed ?? '',
        unitCount: units.length,
        campId: campDoc?._id?.toString(),
        camp: campDoc?._id
          ? { id: campDoc._id.toString(), name: campDoc.name || '', address: campDoc.address }
          : undefined,
        donorFitness: doc.donorFitness as { isFit: boolean; rejectionReason?: string; rejectedAtStep?: string } | undefined,
        medicalExam: doc.medicalExam as Record<string, unknown> | undefined,
        isFit: doc.donorFitness?.isFit,
        createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
        updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt.toISOString(),
        units: units.map((u) => ({
          unitId: u.unitId,
          componentType: u.componentType,
          volumeMl: u.volumeMl,
          expiresAt: u.expiresAt.toISOString(),
          status: u.status,
        })),
        ttiResultId: tti?._id?.toString(),
        ttiReleaseDecision: tti?.releaseDecision,
        requisitions: requisitionsInfo,
      };
    },

    async list(q) {
      const filter: Record<string, unknown> = {};
      if (q.deletedOnly) {
        filter.deletedAt = { $ne: null };
      } else if (!q.includeDeleted) {
        filter.deletedAt = null;
      }
      if (q.donorId) filter.donor = new Types.ObjectId(q.donorId);
      if (q.donationType) filter.donationType = q.donationType;
      if (q.campId) filter.campId = new Types.ObjectId(q.campId);
      if (q.source === 'inhouse') {
        // Match donations with no camp: campId is null, undefined, or the field doesn't exist.
        filter.$or = [{ campId: null }, { campId: { $exists: false } }];
      }
      if (q.source === 'camp') filter.campId = { $exists: true, $ne: null };
      if (q.fromDate || q.toDate) {
        filter.collectedAt = {} as Record<string, Date>;
        if (q.fromDate) (filter.collectedAt as Record<string, Date>).$gte = q.fromDate;
        if (q.toDate) (filter.collectedAt as Record<string, Date>).$lte = q.toDate;
      }
      const skip = (q.page - 1) * q.pageSize;
      const [docs, total] = await Promise.all([
        DonationModel.find(filter)
          .populate<{ donor: { _id: Types.ObjectId; name?: { firstName?: string; middleName?: string; lastName?: string }; bloodGroup?: string; rh?: string } }>('donor', 'name bloodGroup rh')
          .sort({ collectedAt: -1 })
          .skip(skip)
          .limit(q.pageSize)
          .lean(),
        DonationModel.countDocuments(filter),
      ]);
      const [unitDocs, ttiResults] = await Promise.all([
        BloodUnitModel.find({
          donationId: { $in: docs.map((d) => d.donationId) },
          deletedAt: null
        }).select('donationId componentType volumeMl status').lean(),
        TtiResultModel.find({
          donationId: { $in: docs.map((d) => d.donationId) }
        }).select('donationId aboGroupConfirmed rhFactorConfirmed releaseDecision tests decisionNotes').lean()
      ]);

      const unitMap = new Map<string, typeof unitDocs>();
      for (const u of unitDocs) {
        if (!unitMap.has(u.donationId)) {
          unitMap.set(u.donationId, []);
        }
        unitMap.get(u.donationId)!.push(u);
      }

      // Legacy status label used across the donor/donation register exports.
      const legacyComponentStatus = (status: string) => {
        if (status === 'RESERVED' || status === 'CROSSMATCHED') return 'reserved';
        if (status === 'ISSUED' || status === 'TRANSFUSED') return 'utilized';
        if (status === 'DISCARDED') return 'discarded';
        if (status === 'EXPIRED') return 'expired';
        return 'in-stock';
      };

      const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));
      return {
        items: docs.map((d) => {
          const donorDoc = d.donor as unknown as { _id: Types.ObjectId; name?: { firstName?: string; middleName?: string; lastName?: string }; bloodGroup?: string; rh?: string };
          const tti = ttiMap.get(d.donationId);
          const units = unitMap.get(d.donationId) || [];
          const statuses = units.map((u) => u.status);

          let status = 'collected';
          if (d.donorFitness?.isFit === false) {
            status = 'failed';
          } else if (statuses.includes('ISSUED')) {
            status = 'issued';
          } else if (tti) {
            if (tti.releaseDecision === 'released') status = 'passed';
            else if (tti.releaseDecision === 'reactive') status = 'failed';
            else if (tti.releaseDecision === 'pending') status = 'testing';
          }

          const testMap: Record<string, string> = {};
          (tti?.tests || []).forEach((t) => {
            testMap[t.testName] = t.result;
          });

          return {
            id: d._id.toString(),
            donationId: d.donationId,
            donor: donorDoc?._id?.toString() ?? d.donor?.toString() ?? '',
            donorName: donorDoc?.name
              ? [donorDoc.name.firstName, donorDoc.name.middleName, donorDoc.name.lastName].filter(Boolean).join(' ')
              : undefined,
            donationType: d.donationType,
            typeOfBag: d.typeOfBag,
            bagNo: d.bagNo,
            segmentNo: d.segmentNo,
            lotNo: d.lotNo,
            collectedAt: d.collectedAt.toISOString(),
            bloodGroup: tti?.aboGroupConfirmed || (donorDoc?.bloodGroup ? `${donorDoc.bloodGroup}${(donorDoc.rh === 'Positive' || donorDoc.rh === 'POSITIVE' || donorDoc.rh === '+') ? '+' : '-'}` : ''),
            rhFactor: tti?.rhFactorConfirmed || donorDoc?.rh || '',
            unitCount: statuses.length,
            campId: d.campId?.toString(),
            isFit: d.donorFitness?.isFit,
            status,
            deletedAt: d.deletedAt ? new Date(d.deletedAt as unknown as Date).toISOString() : null,
            createdAt: (d as unknown as { createdAt: Date }).createdAt.toISOString(),
            updatedAt: (d as unknown as { updatedAt: Date }).updatedAt.toISOString(),
            components: units.map((u) => ({
              componentType: u.componentType,
              volumeMl: u.volumeMl,
              status: legacyComponentStatus(u.status),
            })),
            ttiTests: {
              HIV: testMap['HIV'] || null,
              HBSAG: testMap['HBSAG'] || null,
              HCV: testMap['HCV'] || null,
              SYPHILIS: testMap['SYPHILIS'] || null,
              MALARIA: testMap['MALARIA'] || null,
            },
            ttiReason: tti?.decisionNotes || null,
          };
        }),
        total,
      };
    },

    async findLatestByDonor(donorId) {
      const doc = await DonationModel.findOne({
        donor: new Types.ObjectId(donorId),
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
        .sort({ collectedAt: -1 })
        .select('collectedAt donationType')
        .lean();
      if (!doc) return null;
      return { collectedAt: doc.collectedAt, donationType: doc.donationType };
    },

    async findRawStatus(id) {
      const doc = await DonationModel.findById(id).select('deletedAt').lean();
      if (!doc) return null;
      return { deletedAt: (doc.deletedAt as unknown as Date) ?? null };
    },

    async softDelete(id, actorId) {
      const result = await DonationModel.updateOne(
        { _id: id },
        { deletedAt: new Date(), updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donation', id);
    },

    async restore(id, actorId) {
      const result = await DonationModel.updateOne(
        { _id: id },
        { deletedAt: null, updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donation', id);
    },

    // Permanent, irreversible removal — only reached once a donation has
    // already been soft-deleted (see donation.service.ts remove()).
    async delete(id) {
      const result = await DonationModel.deleteOne({ _id: id });
      if (result.deletedCount === 0) throw new NotFoundError('Donation', id);
    },

    async lookupByBagNo(bagNo) {
      const donation = await DonationModel.findOne({
        $or: [{ donationId: bagNo }, { bagNo }],
        deletedAt: null,
      }).lean();
      if (!donation) return null;
      return {
        lotNo: (donation as any).lotNo || '',
        segmentNo: (donation as any).segmentNo || '',
      };
    },

    async bagNosByDonationIds(donationIds) {
      if (donationIds.length === 0) return {};
      const donations = (await DonationModel.find({
        donationId: { $in: donationIds },
        deletedAt: null,
      })
        .select('donationId bagNo')
        .lean()) as Array<{ donationId: string; bagNo?: string | null }>;
      const map: Record<string, string> = {};
      for (const d of donations) {
        map[d.donationId] = d.bagNo || d.donationId;
      }
      return map;
    },
  };
}

export const __forTesting = { DonationModel, BloodUnitModel, TtiResultModel, NotFoundError };
