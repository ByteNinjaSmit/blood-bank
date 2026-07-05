// Donation repository. Writes to the NEW donations / bloodunits /
// ttiresults collections. Reads from the same. Legacy `bloodbags`
// collection is untouched by this repo — the cutover migration script
// keeps the two in sync.

import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DonorModel } from '@/modules/donor/donor.model';
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
  isFit?: boolean;
  createdAt: string;
  updatedAt: string;
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
  list(q: ListDonationsInput): Promise<{ items: DonationDto[]; total: number }>;
  findLatestByDonor(donorId: string): Promise<{ collectedAt: Date; donationType: string } | null>;
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

            // Update donor's lastDonationDate if the donor is fit
            if (input.donorFitness.isFit) {
              await DonorModel.findByIdAndUpdate(
                donorObjId,
                { lastDonationDate: input.collectedAt, updatedAt: new Date() },
                { session },
              );
            }


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

        // Update donor's lastDonationDate in fallback path too
        if (input.donorFitness.isFit) {
          await DonorModel.findByIdAndUpdate(
            donorObjId,
            { lastDonationDate: input.collectedAt, updatedAt: new Date() },
          );
        }

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
        .lean();
      if (!doc) return null;
      const donorDoc = doc.donor as unknown as { _id: Types.ObjectId; name?: { firstName?: string; middleName?: string; lastName?: string } };
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
        campId: doc.campId?.toString(),
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
      const filter: Record<string, unknown> = {
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      };
      if (q.donorId) filter.donor = new Types.ObjectId(q.donorId);
      if (q.donationType) filter.donationType = q.donationType;
      if (q.campId) filter.campId = new Types.ObjectId(q.campId);
      if (q.source === 'inhouse') {
        // Match donations with no camp: campId is null, undefined, or the field doesn't exist.
        const inhouse$or = [{ campId: null }, { campId: { $exists: false } }];
        // We already have a top-level $or for deletedAt — wrap both in $and.
        const existing$or = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: existing$or }, { $or: inhouse$or }];
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
        }).select('donationId status').lean(),
        TtiResultModel.find({
          donationId: { $in: docs.map((d) => d.donationId) }
        }).select('donationId aboGroupConfirmed rhFactorConfirmed releaseDecision').lean()
      ]);

      const unitMap = new Map<string, string[]>();
      for (const u of unitDocs) {
        if (!unitMap.has(u.donationId)) {
          unitMap.set(u.donationId, []);
        }
        unitMap.get(u.donationId)!.push(u.status);
      }

      const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));
      return {
        items: docs.map((d) => {
          const donorDoc = d.donor as unknown as { _id: Types.ObjectId; name?: { firstName?: string; middleName?: string; lastName?: string }; bloodGroup?: string; rh?: string };
          const tti = ttiMap.get(d.donationId);
          const statuses = unitMap.get(d.donationId) || [];

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
            createdAt: (d as unknown as { createdAt: Date }).createdAt.toISOString(),
            updatedAt: (d as unknown as { updatedAt: Date }).updatedAt.toISOString(),
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
  };
}

export const __forTesting = { DonationModel, BloodUnitModel, TtiResultModel, NotFoundError };
