import type {
  CreateDonorInput,
  ListDonorsInput,
  UpdateDonorInput,
} from '@/modules/donor/donor.validator';
import { NotFoundError } from '@/shared/errors';
import { DonorModel } from './donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { CampModel } from '@/modules/camp/camp.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { Types } from 'mongoose';

export interface DonorDto {
  id: string;
  donorId?: string;
  name: { firstName: string; middleName?: string; lastName: string };
  uid?: string;
  dob: string;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email?: string;
  donationHistory?: any[];
  address: {
    line1?: string;
    line2?: string;
    city: string;
    district: string;
    state: string;
    pincode?: string;
  };
  occupation?: string;
  weightKg: number;
  bloodGroup: 'A' | 'B' | 'AB' | 'O';
  rh: 'Positive' | 'Negative';
  eligibilityStatus?: 'eligible' | 'deferred' | 'temp-deferred';
  lastDonationDate?: string;
  lastDonationId?: string;
  isAvailableToDonate?: boolean;
  daysUntilEligible?: number;
  source?: 'inhouse' | 'camp';
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RawDonor {
  _id: { toString(): string };
  donorId?: string;
  name: { firstName: string; middleName?: string; lastName: string };
  uid?: string;
  dob: Date;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email?: string;
  address: DonorDto['address'];
  occupation?: string;
  weightKg: number;
  bloodGroup: DonorDto['bloodGroup'];
  rh: DonorDto['rh'];
  eligibilityStatus?: DonorDto['eligibilityStatus'];
  lastDonationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function toDto(raw: any): any {
  const firstName = raw.name?.firstName || '';
  const middleName = raw.name?.middleName || '';
  const lastName = raw.name?.lastName || '';
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  let age = 0;
  if (raw.dob) {
    const dobDate = new Date(raw.dob);
    const today = new Date();
    age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
  }

  let isAvailableToDonate = true;
  let daysUntilEligible = 0;
  if (raw.lastDonationDate) {
    const lastDate = raw.lastDonationDate instanceof Date ? raw.lastDonationDate : new Date(raw.lastDonationDate);
    const now = new Date();
    lastDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const waitingPeriod = raw.sex === 'F' ? 120 : 90;
    if (diffDays < waitingPeriod) {
      isAvailableToDonate = false;
      daysUntilEligible = waitingPeriod - diffDays;
    }
  }

  return {
    id: raw._id?.toString() || raw.id,
    _id: raw._id?.toString() || raw.id,
    donorId: raw.donorId,
    name: raw.name,
    fullName,
    age,
    city: raw.address?.city,
    uid: raw.uid,
    dob: raw.dob instanceof Date ? raw.dob.toISOString() : new Date(raw.dob).toISOString(),
    sex: raw.sex,
    phone: raw.phone,
    email: raw.email,
    address: raw.address,
    occupation: raw.occupation,
    weightKg: raw.weightKg,
    bloodGroup: raw.bloodGroup,
    rh: raw.rh === 'POSITIVE' ? 'Positive' : raw.rh === 'NEGATIVE' ? 'Negative' : raw.rh,
    eligibilityStatus: raw.eligibilityStatus,
    lastDonationDate: raw.lastDonationDate ? (raw.lastDonationDate instanceof Date ? raw.lastDonationDate.toISOString() : new Date(raw.lastDonationDate).toISOString()) : undefined,
    isAvailableToDonate,
    daysUntilEligible,
    deletedAt: raw.deletedAt ? (raw.deletedAt instanceof Date ? raw.deletedAt.toISOString() : new Date(raw.deletedAt).toISOString()) : null,
    createdAt: raw.createdAt ? (raw.createdAt instanceof Date ? raw.createdAt.toISOString() : new Date(raw.createdAt).toISOString()) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? (raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : new Date(raw.updatedAt).toISOString()) : new Date().toISOString(),
  };
}

export interface DonorRepo {
  create(input: CreateDonorInput, actorId: string): Promise<DonorDto>;
  findById(id: string): Promise<DonorDto | null>;
  update(id: string, patch: UpdateDonorInput, actorId: string): Promise<DonorDto>;
  list(input: ListDonorsInput): Promise<{ items: DonorDto[]; total: number }>;
  softDelete(id: string, actorId: string): Promise<void>;
  restore(id: string, actorId: string): Promise<void>;
  delete(id: string): Promise<void>;
  findActiveByPhone(phone: string): Promise<DonorDto | null>;
}

async function populateLastDonationId(dtos: DonorDto[]): Promise<DonorDto[]> {
  if (dtos.length === 0) return dtos;
  const donorIds = dtos.map(d => new Types.ObjectId(d.id));
  const donations = await DonationModel.aggregate([
    {
      $match: {
        donor: { $in: donorIds },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
    },
    { $sort: { collectedAt: -1, createdAt: -1 } },
    {
      $group: {
        _id: '$donor',
        lastDonationId: { $first: '$_id' },
        lastDonationDate: { $first: '$collectedAt' },
      },
    },
  ]);
  const donationMap = new Map(
    donations.map(d => [
      d._id.toString(),
      { id: d.lastDonationId.toString(), date: d.lastDonationDate },
    ]),
  );
  return dtos.map(dto => {
    const dbDonation = donationMap.get(dto.id);
    let effectiveDate = dto.lastDonationDate;
    if (dbDonation?.date) {
      const dbDate = new Date(dbDonation.date);
      const profileDate = dto.lastDonationDate ? new Date(dto.lastDonationDate) : null;
      if (profileDate) {
        effectiveDate = dbDate > profileDate ? dbDate.toISOString() : profileDate.toISOString();
      } else {
        effectiveDate = dbDate.toISOString();
      }
    }

    let isAvailableToDonate = true;
    let daysUntilEligible = 0;
    if (effectiveDate) {
      const lastDate = new Date(effectiveDate);
      const now = new Date();
      lastDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const waitingPeriod = dto.sex === 'F' ? 120 : 90;
      if (diffDays < waitingPeriod) {
        isAvailableToDonate = false;
        daysUntilEligible = waitingPeriod - diffDays;
      }
    }

    return {
      ...dto,
      lastDonationId: dbDonation?.id,
      lastDonationDate: effectiveDate,
      isAvailableToDonate,
      daysUntilEligible,
    };
  });
}

async function getDetailedDonationHistory(donorId: string): Promise<any[]> {
  const donations = await DonationModel.find({
    donor: new Types.ObjectId(donorId),
    deletedAt: null,
  })
    .sort({ collectedAt: -1 })
    .lean();

  const history = [];

  for (const donation of donations) {
    let donationPlace = 'Inhouse';
    if (donation.campId) {
      const camp = await CampModel.findById(donation.campId).lean();
      if (camp) {
        donationPlace = `Camp: ${camp.name}`;
      }
    }

    // Find components (BloodUnits) derived from this donation
    const components = await BloodUnitModel.find({
      donationId: donation.donationId,
      deletedAt: null,
    }).lean();

    const componentsWithReqs = [];
    for (const comp of components) {
      // Find if this component has a requisition
      let reqDoc = null;
      if (comp.reservedFor) {
        reqDoc = await RequisitionModel.findById(comp.reservedFor).lean();
      } else {
        reqDoc = await RequisitionModel.findOne({
          'matchedUnits.unitId': comp.unitId,
          deletedAt: null,
        }).lean();
      }

      let requisitionDetails = null;
      if (reqDoc) {
        const hospital = await HospitalModel.findById(reqDoc.hospitalId).lean();
        requisitionDetails = {
          requisitionId: reqDoc.requisitionId,
          hospitalName: hospital ? hospital.name : 'Unknown Hospital',
          patientName: reqDoc.patient?.name || 'N/A',
          urgency: reqDoc.requestedComponents?.find(rc => rc.componentType === comp.componentType)?.urgency || 'ROUTINE',
          status: reqDoc.status,
          requiredAt: reqDoc.requiredAt ? reqDoc.requiredAt.toISOString() : null,
        };
      }

      componentsWithReqs.push({
        unitId: comp.unitId,
        componentType: comp.componentType,
        aboGroup: comp.aboGroup,
        rhFactor: comp.rhFactor,
        volumeMl: comp.volumeMl,
        status: comp.status,
        expiresAt: comp.expiresAt ? comp.expiresAt.toISOString() : null,
        requisition: requisitionDetails,
      });
    }

    history.push({
      donationId: donation.donationId,
      bagNo: donation.bagNo,
      segmentNo: donation.segmentNo || 'N/A',
      lotNo: donation.lotNo || 'N/A',
      collectedAt: donation.collectedAt ? donation.collectedAt.toISOString() : null,
      donationPlace,
      components: componentsWithReqs,
    });
  }

  return history;
}

export function createDonorRepo(): DonorRepo {
  return {
    async create(input, actorId) {
      const dbRh = input.rh === 'Positive' ? 'POSITIVE' : input.rh === 'Negative' ? 'NEGATIVE' : input.rh;
      const doc = await DonorModel.create({
        ...input,
        rh: dbRh,
        createdBy: actorId,
        updatedBy: actorId,
      });
      const raw = doc.toObject() as unknown as RawDonor;
      const dtos = await populateLastDonationId([toDto(raw)]);
      return dtos[0] as DonorDto;
    },

    async findById(id) {
      const raw = (await DonorModel.findById(id).lean()) as unknown as RawDonor | null;
      if (!raw) return null;
      const dtos = await populateLastDonationId([toDto(raw)]);
      const history = await getDetailedDonationHistory(id);
      return {
        ...dtos[0],
        donationHistory: history,
      } as DonorDto;
    },

    async update(id, patch, actorId) {
      const dbPatch = { ...patch } as any;
      if (patch.rh) {
        dbPatch.rh = patch.rh === 'Positive' ? 'POSITIVE' : patch.rh === 'Negative' ? 'NEGATIVE' : patch.rh;
      }
      const updated = (await DonorModel.findByIdAndUpdate(
        id,
        { ...dbPatch, updatedBy: actorId, updatedAt: new Date() },
        { new: true, runValidators: true },
      ).lean()) as unknown as RawDonor | null;
      if (!updated) throw new NotFoundError('Donor', id);
      const dtos = await populateLastDonationId([toDto(updated)]);
      const history = await getDetailedDonationHistory(id);
      return {
        ...dtos[0],
        donationHistory: history,
      } as DonorDto;
    },

    async list(input) {
      const filter: Record<string, unknown> = {};
      if (input.deletedOnly) {
        filter.deletedAt = { $ne: null };
      } else {
        filter.deletedAt = null;
      }
      if (input.bloodGroup) filter.bloodGroup = input.bloodGroup;
      if (input.rh) filter.rh = input.rh === 'Positive' ? 'POSITIVE' : input.rh === 'Negative' ? 'NEGATIVE' : input.rh;
      if (input.city) filter['address.city'] = input.city;
      // Filter by eligibility status: support "deferred" to match both deferred types
      if (input.eligibilityStatus === 'deferred') {
        filter.eligibilityStatus = { $in: ['deferred', 'temp-deferred'] };
      } else if (input.eligibilityStatus) {
        filter.eligibilityStatus = input.eligibilityStatus;
      }

      if (input.source === 'camp') {
        const campDonations = await DonationModel.find({ campId: { $ne: null } }, { donor: 1 }).lean();
        const campDonorIds = campDonations.map(d => d.donor?.toString()).filter(Boolean);
        const camps = await CampModel.find({}, { donorData: 1 }).lean();
        const campDataDonorIds = camps.flatMap(c => c.donorData || []).map(id => id.toString());
        const allCampDonorIds = Array.from(new Set([...campDonorIds, ...campDataDonorIds]));
        filter._id = { $in: allCampDonorIds.map(id => new Types.ObjectId(id)) };
      } else if (input.source === 'inhouse') {
        const campDonations = await DonationModel.find({ campId: { $ne: null } }, { donor: 1 }).lean();
        const campDonorIds = campDonations.map(d => d.donor?.toString()).filter(Boolean);
        const camps = await CampModel.find({}, { donorData: 1 }).lean();
        const campDataDonorIds = camps.flatMap(c => c.donorData || []).map(id => id.toString());
        const allCampDonorIds = Array.from(new Set([...campDonorIds, ...campDataDonorIds]));
        filter._id = { $nin: allCampDonorIds.map(id => new Types.ObjectId(id)) };
      }

      if (input.campId) {
        const campIdObj = new Types.ObjectId(input.campId);
        const campDonations = await DonationModel.find({ campId: campIdObj }, { donor: 1 }).lean();
        const campDonorIds = campDonations.map(d => d.donor?.toString()).filter(Boolean);
        const camp = await CampModel.findById(campIdObj, { donorData: 1 }).lean();
        const campDataDonorIds = (camp?.donorData || []).map(id => id.toString());
        const specificCampDonorIds = Array.from(new Set([...campDonorIds, ...campDataDonorIds]));
        const existingIdFilter = (filter._id as any) || {};
        filter._id = { ...existingIdFilter, $in: specificCampDonorIds.map(id => new Types.ObjectId(id)) };
      }

      if (input.search) {
        const term = input.search.trim();
        filter.$or = [
          { 'name.firstName': { $regex: term, $options: 'i' } },
          { 'name.lastName': { $regex: term, $options: 'i' } },
          { donorId: { $regex: term, $options: 'i' } },
          { phone: { $regex: term, $options: 'i' } },
          { uid: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
        ];
      }

      if (input.from || input.to) {
        const range: Record<string, Date> = {};
        if (input.from) range.$gte = input.from;
        if (input.to) range.$lte = input.to;
        filter.createdAt = range;
      }

      const sortField = input.sortBy === 'name' ? 'name.firstName' : input.sortBy;
      const sortDir = input.order === 'asc' ? 1 : -1;

      const skip = (input.page - 1) * input.pageSize;
      const [docs, total] = await Promise.all([
        DonorModel.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(input.pageSize).lean(),
        DonorModel.countDocuments(filter),
      ]);
      const dtos = (docs as unknown as RawDonor[]).map(toDto);
      const populatedDtos = await populateLastDonationId(dtos);

      // Compute camp donor IDs so each DTO can be tagged with its source.
      // Re-use the camp lookup only when we don't already know (i.e. source filter not set).
      let campDonorIdSet: Set<string>;
      if (input.source === 'camp') {
        campDonorIdSet = new Set(populatedDtos.map(d => d.id));
      } else if (input.source === 'inhouse') {
        campDonorIdSet = new Set();
      } else {
        const [campDonationsAll, campsAll] = await Promise.all([
          DonationModel.find({ campId: { $ne: null } }, { donor: 1 }).lean(),
          CampModel.find({}, { donorData: 1 }).lean(),
        ]);
        const campDonorIdsAll = campDonationsAll.map(d => d.donor?.toString()).filter(Boolean) as string[];
        const campDataDonorIdsAll = campsAll.flatMap(c => c.donorData || []).map(id => id.toString());
        campDonorIdSet = new Set([...campDonorIdsAll, ...campDataDonorIdsAll]);
      }

      const taggedDtos = populatedDtos.map(dto => ({
        ...dto,
        source: campDonorIdSet.has(dto.id) ? ('camp' as const) : ('inhouse' as const),
      }));

      return {
        items: taggedDtos,
        total,
      };
    },

    async softDelete(id, actorId) {
      const result = await DonorModel.updateOne(
        { _id: id },
        { deletedAt: new Date(), updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donor', id);
    },

    async restore(id, actorId) {
      const result = await DonorModel.updateOne(
        { _id: id },
        { deletedAt: null, updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donor', id);
    },

    // Permanent, irreversible removal — only reached once a donor has
    // already been soft-deleted (see donor.service.ts remove()).
    async delete(id) {
      const result = await DonorModel.deleteOne({ _id: id });
      if (result.deletedCount === 0) throw new NotFoundError('Donor', id);
    },

    async findActiveByPhone(phone) {
      const raw = (await DonorModel.findOne({ phone }).lean()) as unknown as RawDonor | null;
      if (!raw) return null;
      const dtos = await populateLastDonationId([toDto(raw)]);
      return dtos[0] as DonorDto;
    },
  };
}
