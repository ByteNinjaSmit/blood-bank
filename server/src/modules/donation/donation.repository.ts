// Donation repository. Writes to the NEW donations / bloodunits /
// ttiresults collections. Reads from the same. Legacy `bloodbags`
// collection is untouched by this repo — the cutover migration script
// keeps the two in sync.

import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import type { CreateDonationInput, ListDonationsInput } from '@/modules/donation/donation.validator';
import type { DerivedUnit } from '@/modules/donation/donation.unit-derivation';
import { NotFoundError } from '@/shared/errors';

export interface DonationDto {
  id: string;
  donationId: string;
  donor: string;
  donationType: string;
  collectedAt: string;
  bloodGroup: string;
  rhFactor: string;
  unitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DonationWithUnitsDto extends DonationDto {
  units: Array<{
    unitId: string;
    componentType: string;
    volumeMl: number;
    expiresAt: string;
    status: string;
  }>;
  ttiResultId?: string;
  ttiReleaseDecision?: string;
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
      const siteId = input.siteId ? new Types.ObjectId(input.siteId) : undefined;
      const phlebotomistId = input.phlebotomistId
        ? new Types.ObjectId(input.phlebotomistId)
        : actor;

      // Per rebuild contract, dual-write would normally happen here.
      // The donation/unit/tti collections are NEW; nothing dual-writes
      // to bloodbags. The legacy /api/donation continues to write
      // bloodbags directly. The migration script reconciles.
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
                siteId,
                phlebotomistId,
                medicalExam: input.medicalExam,
                donorFitness: input.donorFitness,
                questionnaireFlags: input.questionnaireFlags
                  ? new Map(Object.entries(input.questionnaireFlags))
                  : undefined,
                notes: input.notes,
                createdBy: actor,
                updatedBy: actor,
              },
            ],
            { session },
          );

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
              siteId,
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
    },

    async findById(id) {
      const doc = await DonationModel.findById(id).lean();
      if (!doc) return null;
      const [units, tti] = await Promise.all([
        BloodUnitModel.find({ donationId: doc.donationId })
          .select('unitId componentType volumeMl expiresAt status')
          .lean(),
        TtiResultModel.findOne({ donationId: doc.donationId })
          .select('_id releaseDecision')
          .lean(),
      ]);
      return {
        id: doc._id.toString(),
        donationId: doc.donationId,
        donor: doc.donor.toString(),
        donationType: doc.donationType,
        collectedAt: doc.collectedAt.toISOString(),
        bloodGroup: tti?.aboGroupConfirmed ?? '',
        rhFactor: tti?.rhFactorConfirmed ?? '',
        unitCount: units.length,
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
      };
    },

    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.donorId) filter.donor = new Types.ObjectId(q.donorId);
      if (q.donationType) filter.donationType = q.donationType;
      if (q.fromDate || q.toDate) {
        filter.collectedAt = {} as Record<string, Date>;
        if (q.fromDate) (filter.collectedAt as Record<string, Date>).$gte = q.fromDate;
        if (q.toDate) (filter.collectedAt as Record<string, Date>).$lte = q.toDate;
      }
      const skip = (q.page - 1) * q.pageSize;
      const [docs, total] = await Promise.all([
        DonationModel.find(filter)
          .sort({ collectedAt: -1 })
          .skip(skip)
          .limit(q.pageSize)
          .lean(),
        DonationModel.countDocuments(filter),
      ]);
      const unitCounts = await BloodUnitModel.aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: { donationId: { $in: docs.map((d) => d.donationId) } } },
        { $group: { _id: '$donationId', count: { $sum: 1 } } },
      ]);
      const countMap = new Map(unitCounts.map((u) => [u._id, u.count]));
      return {
        items: docs.map((d) => ({
          id: d._id.toString(),
          donationId: d.donationId,
          donor: d.donor.toString(),
          donationType: d.donationType,
          collectedAt: d.collectedAt.toISOString(),
          bloodGroup: '',
          rhFactor: '',
          unitCount: countMap.get(d.donationId) ?? 0,
          createdAt: (d as unknown as { createdAt: Date }).createdAt.toISOString(),
          updatedAt: (d as unknown as { updatedAt: Date }).updatedAt.toISOString(),
        })),
        total,
      };
    },

    async findLatestByDonor(donorId) {
      const doc = await DonationModel.findOne({
        donor: new Types.ObjectId(donorId),
        deletedAt: null,
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
