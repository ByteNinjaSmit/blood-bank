import { Types } from 'mongoose';
import {
  findAcrossDonations,
  findByIdAcrossDonations,
  findOneAcrossDonations,
  countAcrossDonations,
} from '@/modules/donation/donation-collections.util';
import { DonorModel } from '@/modules/donor/donor.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { PatientModel } from '@/modules/patient/patient.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import type { ListBagIssueInput } from '@/modules/bag-issue/bag-issue.validator';

export interface BagIssueDto {
  id: string;
  _id?: string;
  issueNumber: string;
  issueDate: string;
  stockId: string;
  bagSerialNumber: string;
  bagType: string;
  batchNumber: string;
  issuedById: string;
  collectionRoom?: string;
  donorId?:
    | string
    | {
        id: string;
        name?: { firstName?: string; middleName?: string; lastName?: string };
        dob?: string;
        sex?: string;
        phone?: string;
        email?: string;
        bloodGroup?: string;
        rh?: string;
      };
  donationId?:
    | string
    | {
        id: string;
        donationId: string;
        donationType: string;
        collectedAt: string;
        segmentNo?: string | null;
        typeOfBag?: string;
        medicalExam?: any;
      };
  status: string;
  returnedAt?: string;
  usedAt?: string;
  damagedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  segmentNo?: string;
  donorName?: string;
  bloodGroup?: string;
  requisitions?: Array<{
    unitId: string;
    componentType: string;
    status: string;
    aboGroup: string;
    rhFactor: string;
    expiresAt: string;
    requisitionId?: string;
    requisitionDbId?: string;
    hospitalName?: string;
    patientName?: string;
    clinicianName?: string;
    requiredAt?: string;
    requisitionStatus?: string;
    issue?: {
      issueId: string;
      issuedAt: string;
      collectedByName?: string;
      transportTempCelsius?: number;
    } | null;
  }>;
}

// findAcrossDonations/findByIdAcrossDonations don't support populate (they
// span two collections) — batch-join donor docs manually instead.
async function withDonor<T extends { donor?: unknown }>(doc: T | null): Promise<T | null> {
  if (!doc?.donor) return doc;
  const donor = await DonorModel.findById(doc.donor).lean();
  return donor ? { ...doc, donor } : doc;
}

async function withDonors<T extends { donor?: unknown }>(docs: T[]): Promise<T[]> {
  const donorIds = [...new Set(docs.map((d) => d.donor).filter(Boolean))];
  if (donorIds.length === 0) return docs;
  const donors = await DonorModel.find({ _id: { $in: donorIds } }).lean();
  const donorById = new Map(donors.map((d) => [d._id.toString(), d]));
  return docs.map((d) => (d.donor ? { ...d, donor: donorById.get(String(d.donor)) } : d));
}

function toDto(doc: any, unitStatuses: string[] = []): BagIssueDto {
  const donor = doc.donor;

  // Status is DAMAGED if any unit of the donation is DISCARDED
  const isDiscarded = unitStatuses.includes('DISCARDED');
  const status = isDiscarded ? 'DAMAGED' : 'ISSUED';

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    issueNumber: doc.donationId || '',
    issueDate: doc.collectedAt ? doc.collectedAt.toISOString() : doc.createdAt?.toISOString() || '',
    stockId: doc._id.toString(),
    bagSerialNumber: doc.bagNo || '—',
    bagType:
      doc.typeOfBag === 'SB'
        ? 'SINGLE'
        : doc.typeOfBag === 'DB'
          ? 'DOUBLE'
          : doc.typeOfBag === 'TB'
            ? 'TRIPLE'
            : doc.typeOfBag === 'QB'
              ? 'QUADRUPLE'
              : 'SINGLE',
    batchNumber: doc.lotNo || '—',
    issuedById: doc.createdBy ? doc.createdBy.toString() : '',
    collectionRoom: doc.campId ? 'Camp' : 'Inhouse',
    donorId: donor?._id
      ? {
          id: donor._id.toString(),
          name: donor.name,
          dob: donor.dob ? new Date(donor.dob).toISOString() : undefined,
          sex: donor.sex,
          phone: donor.phone,
          email: donor.email,
          bloodGroup: donor.bloodGroup,
          rh: donor.rh,
        }
      : doc.donor
        ? doc.donor.toString()
        : undefined,
    donationId: {
      id: doc._id.toString(),
      donationId: doc.donationId || '',
      donationType: doc.donationType || '',
      collectedAt: doc.collectedAt ? doc.collectedAt.toISOString() : '',
      segmentNo: doc.segmentNo || null,
      typeOfBag: doc.typeOfBag || 'SB',
      medicalExam: doc.medicalExam,
    },
    status,
    segmentNo: doc.segmentNo || undefined,
    donorName: donor?.name
      ? [donor.name.firstName, donor.name.middleName, donor.name.lastName].filter(Boolean).join(' ')
      : undefined,
    bloodGroup: donor?.bloodGroup ? `${donor.bloodGroup} ${donor.rh || ''}`.trim() : undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface BagIssueRepo {
  list(q: ListBagIssueInput): Promise<{ items: BagIssueDto[]; total: number }>;
  findById(id: string): Promise<BagIssueDto | null>;
  findBySerialNumber(bagSerialNumber: string): Promise<BagIssueDto | null>;
  create(doc: {
    issueNumber: string;
    issueDate: Date;
    stockId: string;
    bagSerialNumber: string;
    bagType: string;
    batchNumber: string;
    issuedById: string;
    collectionRoom?: string;
    notes?: string;
    actorId: string;
  }): Promise<BagIssueDto>;
  updateStatus(
    id: string,
    patch: {
      status: string;
      donorId?: string;
      donationId?: string;
      segmentNo?: string;
      returnedAt?: Date;
      usedAt?: Date;
      damagedAt?: Date;
    },
    actorId: string,
  ): Promise<BagIssueDto | null>;
}

export function createBagIssueRepo(): BagIssueRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = {
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      };
      if (q.fromDate || q.toDate) {
        const range: Record<string, Date> = {};
        if (q.fromDate) range.$gte = q.fromDate;
        if (q.toDate) range.$lte = q.toDate;
        filter.collectedAt = range;
      }
      if (q.donorId) filter.donor = new Types.ObjectId(q.donorId);

      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [rawDocs, total] = await Promise.all([
        findAcrossDonations<any>(filter).then((all) =>
          all
            .sort((a, b) => (b.collectedAt?.getTime() ?? 0) - (a.collectedAt?.getTime() ?? 0))
            .slice(skip, skip + pageSize),
        ),
        countAcrossDonations(filter),
      ]);
      const docs = await withDonors(rawDocs);

      const donationIds = docs.map((d) => d.donationId);
      const units = await BloodUnitModel.find({
        donationId: { $in: donationIds },
        deletedAt: null,
      })
        .select('donationId status')
        .lean();

      const unitMap = new Map<string, string[]>();
      for (const u of units) {
        if (!unitMap.has(u.donationId)) {
          unitMap.set(u.donationId, []);
        }
        unitMap.get(u.donationId)!.push(u.status);
      }

      return {
        items: docs.map((d) => toDto(d, unitMap.get(d.donationId) || [])),
        total,
      };
    },

    async findById(id) {
      const doc = await withDonor(await findByIdAcrossDonations<any>(id));
      if (!doc) return null;

      const units = await BloodUnitModel.find({
        donationId: doc.donationId,
        deletedAt: null,
      }).lean();

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
                transportTempCelsius: issue.transportTempCelsius || undefined,
              }
            : null,
        };
      });

      const dto = toDto(
        doc,
        units.map((u) => u.status),
      );
      dto.requisitions = requisitionsInfo;
      return dto;
    },

    async findBySerialNumber(bagSerialNumber) {
      const doc = await withDonor(
        await findOneAcrossDonations<any>({ bagNo: bagSerialNumber }),
      );
      if (!doc) return null;

      const units = await BloodUnitModel.find({
        donationId: doc.donationId,
        deletedAt: null,
      }).lean();

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
                transportTempCelsius: issue.transportTempCelsius || undefined,
              }
            : null,
        };
      });

      const dto = toDto(
        doc,
        units.map((u) => u.status),
      );
      dto.requisitions = requisitionsInfo;
      return dto;
    },

    async create(input) {
      return {} as any;
    },

    async updateStatus(id, patch, actorId) {
      return null;
    },
  };
}
