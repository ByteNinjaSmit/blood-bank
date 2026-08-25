// Donation repository. Writes to the NEW donations / bloodunits /
// ttiresults collections. Reads from the same. Legacy `bloodbags`
// collection is untouched by this repo — the cutover migration script
// keeps the two in sync.
//
// In-house donations (no campId) live in DonationModel (`donations`).
// Camp donations (campId set) live in CampDonationRecordModel
// (`campdonationrecords`) — see camp-donation-record.model.ts and
// donation-collections.util.ts. Single-record lookups by Mongo _id or
// public donationId try both collections since the caller may not know
// which one owns the record.

import { Types, type Model } from 'mongoose';
import { DonationModel, type Donation } from '@/modules/donation/donation.model';
import { CampDonationRecordModel } from '@/modules/donation/camp-donation-record.model';
import {
  resolveDonationModel,
  findOwningModel,
} from '@/modules/donation/donation-collections.util';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import type {
  CreateDonationInput,
  ListDonationsInput,
  UpdateDonationInput,
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
  donorPublicId?: string;
  phone?: string;
  donationType: string;
  typeOfBag?: string;
  collectedAt: string;
  bloodGroup: string;
  rhFactor: string;
  unitCount: number;
  campId?: string;
  camp?: { id: string; name: string; address?: string };
  isFit?: boolean;
  status?: string;
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
  ttiEditReason?: string | null;
  ttiLastEditedAt?: string | null;
  ttiRetestedAt?: string | null;
}

export interface DonationWithUnitsDto extends DonationDto {
  donorFitness?: { isFit: boolean; rejectionReason?: string; rejectedAtStep?: string };
  medicalExam?: Record<string, unknown>;
  /** True while this bag sits in an active, not-yet-finalized batch on the
   * Component Separate screen — see donation.model.ts separationBatchActive. */
  separationBatchActive?: boolean;
  /** True while this bag sits selected in an active batch on the Serology TTD Testing screen. */
  ttiBatchActive?: boolean;
  units: Array<{
    unitId: string;
    componentType: string;
    volumeMl: number;
    expiresAt: string;
    status: string;
  }>;
  /** Latest component unit creation time — proxy for when separation was recorded. */
  separatedAt?: string | null;
  ttiResultId?: string;
  ttiReleaseDecision?: string;
  ttiReason?: string | null;
  ttiEditReason?: string | null;
  ttiLastEditedAt?: string | null;
  /** Latest TTD test performedAt across the panel. */
  ttiTestedAt?: string | null;
  requisitions?: any[];
  donorDetails?: {
    phone?: string;
    dob?: string;
    sex?: string;
    bloodGroup?: string;
    rh?: string;
    address?: Record<string, unknown>;
  };
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
  /** Same enriched shape as findById, keyed by the public donationId (not the Mongo _id). */
  findByDonationId(donationId: string): Promise<DonationWithUnitsDto | null>;
  findRawStatus(id: string): Promise<{ deletedAt: Date | null } | null>;
  list(q: ListDonationsInput): Promise<{ items: DonationDto[]; total: number }>;
  findLatestByDonor(donorId: string): Promise<{ collectedAt: Date; donationType: string } | null>;
  softDelete(id: string, actorId: string): Promise<void>;
  restore(id: string, actorId: string): Promise<void>;
  /** Clerical + medical-exam patch (bag/segment/batch no, collectedAt, notes, medicalExam, fitness). */
  update(id: string, patch: Partial<UpdateDonationInput>, actorId: string): Promise<void>;
  delete(id: string): Promise<void>;
  /** Batch/segment lookup by bag number, for the discard-entry form. */
  lookupByBagNo(bagNo: string): Promise<{ lotNo: string; segmentNo: string } | null>;
  /** Map of donationId -> bagNo (falls back to donationId) for a set of donations. */
  bagNosByDonationIds(donationIds: string[]): Promise<Record<string, string>>;
}

// Shared by findById (keyed by Mongo _id) and findByDonationId (keyed by
// the public donationId) so both return the identical enriched shape.
// `model` is whichever of DonationModel / CampDonationRecordModel actually
// owns the record — resolved by the caller first.
async function loadDonationWithUnits(
  model: Model<Donation>,
  mongoId: string,
): Promise<DonationWithUnitsDto | null> {
  const doc = await model
    .findById(mongoId)
    .populate<{
      donor: {
        _id: Types.ObjectId;
        name?: { firstName?: string; middleName?: string; lastName?: string };
        donorId?: string;
        phone?: string;
        dob?: Date;
        sex?: string;
        bloodGroup?: string;
        rh?: string;
        address?: Record<string, unknown>;
      };
    }>('donor', 'name donorId phone dob sex bloodGroup rh address')
    .populate<{
      campId?: { _id: Types.ObjectId; name?: string; address?: string };
    }>('campId', 'name address')
    .lean();
  if (!doc) return null;
  const donorDoc = doc.donor as unknown as {
    _id: Types.ObjectId;
    name?: { firstName?: string; middleName?: string; lastName?: string };
    donorId?: string;
    phone?: string;
    dob?: Date;
    sex?: string;
    bloodGroup?: string;
    rh?: string;
    address?: Record<string, unknown>;
  };
  const campDoc = doc.campId as unknown as
    | { _id: Types.ObjectId; name?: string; address?: string }
    | undefined;
  const [units, tti] = await Promise.all([
    // deletedAt: null — soft-deleted placeholder units (e.g. the 'WB' bag
    // unit cleared out by component.repository.ts separate()) must not
    // resurface here, or an already-separated donation shows both the
    // placeholder and its real component(s).
    BloodUnitModel.find({ donationId: doc.donationId, deletedAt: null })
      .select('unitId componentType volumeMl expiresAt status aboGroup rhFactor createdAt')
      .lean(),
    TtiResultModel.findOne({ donationId: doc.donationId })
      .select(
        '_id releaseDecision aboGroupConfirmed rhFactorConfirmed decisionNotes editReason lastEditedAt retestedAt tests',
      )
      .lean(),
  ]);

  const unitIds = units.map((u) => u.unitId);

  const requisitions = await RequisitionModel.find({
    'matchedUnits.unitId': { $in: unitIds },
    deletedAt: null,
  })
    .populate('hospitalId')
    .populate('patientId')
    .lean();

  const issues = await IssueModel.find({
    unitId: { $in: unitIds },
  }).lean();

  const requisitionsInfo = units.map((u) => {
    const req = requisitions.find((r) => r.matchedUnits.some((mu) => mu.unitId === u.unitId));
    const issue = issues.find((i) => i.unitId === u.unitId);
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
      issue: issue
        ? {
            issueId: issue.issueId,
            issuedAt: issue.issuedAt.toISOString(),
            collectedByName: issue.collectedByName || undefined,
          }
        : null,
    };
  });

  const separatedUnits = units.filter((u) => u.componentType !== 'WB');
  const separatedAt = separatedUnits.length
    ? separatedUnits
        .map((u) => (u as unknown as { createdAt?: Date }).createdAt)
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime())[0]
    : undefined;

  const ttiTests = (tti as unknown as { tests?: Array<{ performedAt?: Date }> })?.tests || [];
  const ttiTestedAt = ttiTests
    .map((t) => t.performedAt)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    id: doc._id.toString(),
    donationId: doc.donationId,
    donor: donorDoc?._id?.toString() ?? doc.donor?.toString() ?? '',
    donorName: donorDoc?.name
      ? [donorDoc.name.firstName, donorDoc.name.middleName, donorDoc.name.lastName]
          .filter(Boolean)
          .join(' ')
      : undefined,
    donorPublicId: donorDoc?.donorId,
    donorDetails: donorDoc
      ? {
          phone: donorDoc.phone,
          dob: donorDoc.dob ? new Date(donorDoc.dob).toISOString() : undefined,
          sex: donorDoc.sex,
          bloodGroup: donorDoc.bloodGroup,
          rh: donorDoc.rh,
          address: donorDoc.address,
        }
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
    donorFitness: doc.donorFitness as
      | { isFit: boolean; rejectionReason?: string; rejectedAtStep?: string }
      | undefined,
    medicalExam: doc.medicalExam as Record<string, unknown> | undefined,
    isFit: doc.donorFitness?.isFit,
    separationBatchActive: Boolean((doc as unknown as { separationBatchActive?: boolean }).separationBatchActive),
    ttiBatchActive: Boolean((doc as unknown as { ttiBatchActive?: boolean }).ttiBatchActive),
    createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt.toISOString(),
    units: units.map((u) => ({
      unitId: u.unitId,
      componentType: u.componentType,
      volumeMl: u.volumeMl,
      expiresAt: u.expiresAt.toISOString(),
      status: u.status,
    })),
    separatedAt: separatedAt ? separatedAt.toISOString() : null,
    ttiResultId: tti?._id?.toString(),
    ttiReleaseDecision: tti?.releaseDecision,
    ttiReason: tti?.decisionNotes || null,
    ttiEditReason: tti?.editReason || null,
    ttiLastEditedAt: tti?.lastEditedAt ? new Date(tti.lastEditedAt).toISOString() : null,
    ttiRetestedAt: tti?.retestedAt ? new Date(tti.retestedAt).toISOString() : null,
    ttiTestedAt: ttiTestedAt ? ttiTestedAt.toISOString() : null,
    requisitions: requisitionsInfo,
  };
}

function docToDto(
  d: any,
  unitMap: Map<string, any[]>,
  ttiMap: Map<string, any>,
  legacyComponentStatus: (status: string) => string,
): DonationDto {
  const donorDoc = d.donor as unknown as {
    _id: Types.ObjectId;
    name?: { firstName?: string; middleName?: string; lastName?: string };
    bloodGroup?: string;
    rh?: string;
    donorId?: string;
    phone?: string;
  };
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
    else if (tti.releaseDecision === 'indeterminate') status = 'shadeness';
  }

  const testMap: Record<string, string> = {};
  (tti?.tests || []).forEach((t: any) => {
    testMap[t.testName] = t.result;
  });

  return {
    id: d._id.toString(),
    donationId: d.donationId,
    donor: donorDoc?._id?.toString() ?? d.donor?.toString() ?? '',
    donorName: donorDoc?.name
      ? [donorDoc.name.firstName, donorDoc.name.middleName, donorDoc.name.lastName]
          .filter(Boolean)
          .join(' ')
      : undefined,
    donorPublicId: donorDoc?.donorId,
    phone: donorDoc?.phone,
    donationType: d.donationType,
    typeOfBag: d.typeOfBag,
    bagNo: d.bagNo,
    segmentNo: d.segmentNo,
    lotNo: d.lotNo,
    collectedAt: d.collectedAt.toISOString(),
    bloodGroup:
      tti?.aboGroupConfirmed ||
      (donorDoc?.bloodGroup
        ? `${donorDoc.bloodGroup}${donorDoc.rh === 'Positive' || donorDoc.rh === 'POSITIVE' || donorDoc.rh === '+' ? '+' : '-'}`
        : ''),
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
    ttiEditReason: tti?.editReason || null,
    ttiLastEditedAt: tti?.lastEditedAt ? new Date(tti.lastEditedAt).toISOString() : null,
    ttiRetestedAt: tti?.retestedAt ? new Date(tti.retestedAt).toISOString() : null,
  };
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
      const TargetDonationModel = resolveDonationModel(campId);

      // Per rebuild contract, dual-write would normally happen here.
      // The donation/unit/tti collections are NEW; nothing dual-writes
      // to bloodbags. The legacy /api/donation continues to write
      // bloodbags directly. The migration script reconciles.
      try {
        const session = await TargetDonationModel.startSession();
        try {
          let result!: DonationWithUnitsDto;
          await session.withTransaction(async () => {
            const [donation] = await TargetDonationModel.create(
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
            // the Donation/CampDonationRecord collections (see
            // donor.repository's populateLastDonationId ->
            // recentDonationDate) so the two never collide in the UI.

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
        const [donation] = await TargetDonationModel.create([
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
        ]);
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

        const [tti] = await TtiResultModel.create([
          {
            donationId: donationPublicId,
            aboGroupConfirmed: input.bloodGroup,
            rhFactorConfirmed: input.rhFactor,
            tests: [],
            releaseDecision: 'pending',
            createdBy: actor,
            updatedBy: actor,
          },
        ]);

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
      const model = await findOwningModel(id);
      if (!model) return null;
      return loadDonationWithUnits(model, id);
    },

    async findByDonationId(donationId) {
      const [inhouseRef, campRef] = await Promise.all([
        DonationModel.findOne({ donationId }).select('_id').lean(),
        CampDonationRecordModel.findOne({ donationId }).select('_id').lean(),
      ]);
      if (inhouseRef) return loadDonationWithUnits(DonationModel, inhouseRef._id.toString());
      if (campRef) return loadDonationWithUnits(CampDonationRecordModel, campRef._id.toString());
      return null;
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
      if (q.fromDate || q.toDate) {
        filter.collectedAt = {} as Record<string, Date>;
        if (q.fromDate) (filter.collectedAt as Record<string, Date>).$gte = q.fromDate;
        if (q.toDate) (filter.collectedAt as Record<string, Date>).$lte = q.toDate;
      }

      // Every camp donation lives in CampDonationRecordModel and every
      // in-house donation lives in DonationModel by construction, so a
      // source/campId filter can target one collection directly; only the
      // unfiltered "all" case needs to union both.
      let models: Model<Donation>[];
      if (q.source === 'inhouse') {
        models = [DonationModel];
      } else if (q.source === 'camp' || q.campId) {
        models = [CampDonationRecordModel];
      } else {
        models = [DonationModel, CampDonationRecordModel];
      }

      const donorPopulate = {
        path: 'donor',
        select: 'name bloodGroup rh donorId phone',
      } as const;

      const skip = (q.page - 1) * q.pageSize;
      let docs: any[];
      let total: number;
      if (models.length === 1) {
        // Single collection matches — keep DB-level pagination as before.
        const [m] = models;
        [docs, total] = await Promise.all([
          m!.find(filter).populate(donorPopulate).sort({ collectedAt: -1 }).skip(skip).limit(q.pageSize).lean(),
          m!.countDocuments(filter),
        ]);
      } else {
        // "All" — union both collections. Each is fetched capped at
        // skip+pageSize (sorted desc), merged, re-sorted, then sliced —
        // correct as long as no single collection alone exceeds that cap
        // out of order, which sorting each side first guarantees.
        const cap = skip + q.pageSize;
        const [groups, counts] = await Promise.all([
          Promise.all(
            models.map((m) =>
              m.find(filter).populate(donorPopulate).sort({ collectedAt: -1 }).limit(cap).lean(),
            ),
          ),
          Promise.all(models.map((m) => m.countDocuments(filter))),
        ]);
        const allDocs = groups.flat();
        allDocs.sort((a: any, b: any) => b.collectedAt.getTime() - a.collectedAt.getTime());
        docs = allDocs.slice(skip, skip + q.pageSize);
        total = counts.reduce((a, b) => a + b, 0);
      }

      const [unitDocs, ttiResults] = await Promise.all([
        BloodUnitModel.find({
          donationId: { $in: docs.map((d: any) => d.donationId) },
          deletedAt: null,
        })
          .select('donationId componentType volumeMl status')
          .lean(),
        TtiResultModel.find({
          donationId: { $in: docs.map((d: any) => d.donationId) },
        })
          .select(
            'donationId aboGroupConfirmed rhFactorConfirmed releaseDecision tests decisionNotes editReason lastEditedAt retestedAt',
          )
          .lean(),
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
        items: docs.map((d: any) => docToDto(d, unitMap, ttiMap, legacyComponentStatus)),
        total,
      };
    },

    async findLatestByDonor(donorId) {
      const filter = {
        donor: new Types.ObjectId(donorId),
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      };
      const [inhouse, camp] = await Promise.all([
        DonationModel.findOne(filter).sort({ collectedAt: -1 }).select('collectedAt donationType').lean(),
        CampDonationRecordModel.findOne(filter)
          .sort({ collectedAt: -1 })
          .select('collectedAt donationType')
          .lean(),
      ]);
      const candidates = [inhouse, camp].filter((d): d is NonNullable<typeof d> => Boolean(d));
      if (candidates.length === 0) return null;
      const latest = candidates.sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())[0]!;
      return { collectedAt: latest.collectedAt, donationType: latest.donationType };
    },

    async findRawStatus(id) {
      const model = await findOwningModel(id);
      if (!model) return null;
      const doc = await model.findById(id).select('deletedAt').lean();
      if (!doc) return null;
      return { deletedAt: (doc.deletedAt as unknown as Date) ?? null };
    },

    async softDelete(id, actorId) {
      const model = (await findOwningModel(id)) ?? DonationModel;
      const result = await model.updateOne(
        { _id: id },
        { deletedAt: new Date(), updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donation', id);
    },

    async restore(id, actorId) {
      const model = (await findOwningModel(id)) ?? DonationModel;
      const result = await model.updateOne(
        { _id: id },
        { deletedAt: null, updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donation', id);
    },

    async update(id, patch, actorId) {
      const $set: Record<string, unknown> = { updatedBy: new Types.ObjectId(actorId) };
      if (patch.collectedAt !== undefined) $set.collectedAt = patch.collectedAt;
      if (patch.typeOfBag !== undefined) $set.typeOfBag = patch.typeOfBag;
      if (patch.donationType !== undefined) $set.donationType = patch.donationType;
      if (patch.bagNo !== undefined) $set.bagNo = patch.bagNo;
      if (patch.segmentNo !== undefined) $set.segmentNo = patch.segmentNo;
      if (patch.lotNo !== undefined) $set.lotNo = patch.lotNo;
      if (patch.editReason !== undefined) {
        $set.lastEditReason = patch.editReason;
        $set.lastEditedAt = new Date();
        $set.lastEditedBy = new Types.ObjectId(actorId);
      }
      const me = patch.medicalExam;
      if (me) {
        if (me.weightKg !== undefined) $set['medicalExam.weightKg'] = me.weightKg;
        if (me.hbGdl !== undefined) $set['medicalExam.hbGdl'] = me.hbGdl;
        if (me.temperatureCelsius !== undefined)
          $set['medicalExam.temperatureCelsius'] = me.temperatureCelsius;
        if (me.pulseBpm !== undefined) $set['medicalExam.pulseBpm'] = me.pulseBpm;
        if (me.bloodPressure?.systolic !== undefined)
          $set['medicalExam.bloodPressure.systolic'] = me.bloodPressure.systolic;
        if (me.bloodPressure?.diastolic !== undefined)
          $set['medicalExam.bloodPressure.diastolic'] = me.bloodPressure.diastolic;
        if (me.oxygenSaturationPercent !== undefined)
          $set['medicalExam.oxygenSaturationPercent'] = me.oxygenSaturationPercent;
        if (me.hasPedalOedema !== undefined) $set['medicalExam.hasPedalOedema'] = me.hasPedalOedema;
        if (me.hasLymphadenopathy !== undefined)
          $set['medicalExam.hasLymphadenopathy'] = me.hasLymphadenopathy;
        if (me.hasCyanosis !== undefined) $set['medicalExam.hasCyanosis'] = me.hasCyanosis;
        if (me.systemicExamNotes !== undefined)
          $set['medicalExam.systemicExamNotes'] = me.systemicExamNotes;
        if (me.skinClearAtPhlebotomy !== undefined)
          $set['medicalExam.skinClearAtPhlebotomy'] = me.skinClearAtPhlebotomy;
        if (me.armsFreeOfPunctureScars !== undefined)
          $set['medicalExam.armsFreeOfPunctureScars'] = me.armsFreeOfPunctureScars;
        if (me.volumeMl !== undefined) $set['medicalExam.volumeMl'] = me.volumeMl;
      }
      if (patch.isFit !== undefined) $set['donorFitness.isFit'] = patch.isFit;
      if (patch.rejectionReason !== undefined)
        $set['donorFitness.rejectionReason'] = patch.rejectionReason;
      const model = (await findOwningModel(id)) ?? DonationModel;
      const result = await model.updateOne({ _id: id }, { $set });
      if (result.matchedCount === 0) throw new NotFoundError('Donation', id);
    },

    // Permanent, irreversible removal — only reached once a donation has
    // already been soft-deleted (see donation.service.ts remove()).
    async delete(id) {
      const model = (await findOwningModel(id)) ?? DonationModel;
      const result = await model.deleteOne({ _id: id });
      if (result.deletedCount === 0) throw new NotFoundError('Donation', id);
    },

    async lookupByBagNo(bagNo) {
      const filter = { $or: [{ donationId: bagNo }, { bagNo }], deletedAt: null };
      const donation =
        (await DonationModel.findOne(filter).lean()) ??
        (await CampDonationRecordModel.findOne(filter).lean());
      if (!donation) return null;
      return {
        lotNo: (donation as any).lotNo || '',
        segmentNo: (donation as any).segmentNo || '',
      };
    },

    async bagNosByDonationIds(donationIds) {
      if (donationIds.length === 0) return {};
      const filter = { donationId: { $in: donationIds }, deletedAt: null };
      const [inhouse, camp] = await Promise.all([
        DonationModel.find(filter).select('donationId bagNo').lean(),
        CampDonationRecordModel.find(filter).select('donationId bagNo').lean(),
      ]);
      const donations = [...inhouse, ...camp] as Array<{ donationId: string; bagNo?: string | null }>;
      const map: Record<string, string> = {};
      for (const d of donations) {
        map[d.donationId] = d.bagNo || d.donationId;
      }
      return map;
    },
  };
}

export const __forTesting = {
  DonationModel,
  CampDonationRecordModel,
  BloodUnitModel,
  TtiResultModel,
  NotFoundError,
};
