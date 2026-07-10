import { Types } from 'mongoose';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import type { AboGroup, ComponentType, RhFactor } from '@/shared/enums';
import { NotFoundError } from '@/shared/errors';

export type RequisitionStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'CROSSMATCHED'
  | 'APPROVED'
  | 'ISSUED'
  | 'COMPLETED'
  | 'REJECTED';

export interface RequestedComponentDto {
  componentType: ComponentType;
  units: number;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  compatibilityMode?: 'UNIVERSAL' | 'MAJOR' | 'MINOR';
}

export interface MatchedUnitDto {
  unitId: string;
  componentType: ComponentType;
  compatibilityType: 'EXACT' | 'COMPATIBLE';
  crossmatchRequired: boolean;
  crossmatchStatus: 'NOT_REQUIRED' | 'PENDING' | 'COMPATIBLE' | 'INCOMPATIBLE';
  reservedAt?: Date | string;
  compatibilityResult?: 'MAJOR_COMPATIBLE' | 'MINOR_COMPATIBLE' | 'UNIVERSAL' | null;
  crossmatchDoneAt?: Date | string | null;
  crossmatchSeenAt?: Date | string | null;
  cardNumber?: string | null;
}

export interface CrossmatchDetails {
  compatibilityResult?: 'MAJOR_COMPATIBLE' | 'MINOR_COMPATIBLE' | 'UNIVERSAL';
  crossmatchDoneAt?: Date;
  crossmatchSeenAt?: Date;
  cardNumber?: string;
}

export interface RequisitionPatientDto {
  name: string;
  address?: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  mrn?: string;
  diagnosis?: string;
  indication?: string;
  hb?: number;
  specialNeeds?: string[];
  history?: {
    previousTransfusions: number;
    approximateDate?: string;
    presenceOfReaction: 'Presence' | 'Absence' | 'None';
  };
  pregnancy?: {
    numPregnancies: number;
    numMiscarriages: number;
    numChildrenWithHemolyticDisease: number;
  };
}

export interface RequisitionDto {
  id: string;
  _id?: string;
  requisitionId: string;
  hospitalId: string;
  patientId: string;
  clinicianName: string;
  doctorName?: string;
  patient?: RequisitionPatientDto;
  requestedComponents: RequestedComponentDto[];
  matchedUnits: MatchedUnitDto[];
  status: RequisitionStatus;
  requiredAt?: string;
  requestedAt?: string;
  createdAt: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

interface RawReq {
  _id: { toString(): string };
  requisitionId: string;
  hospitalId: { toString(): string };
  patientId: { toString(): string };
  clinicianName: string;
  doctorName?: string;
  patient?: RequisitionPatientDto;
  requestedComponents: RequestedComponentDto[];
  matchedUnits: MatchedUnitDto[];
  status: RequisitionStatus;
  requiredAt?: Date;
  requestedAt?: Date;
  createdAt: Date;
  rejectionReason?: string;
  rejectedBy?: { toString(): string };
  rejectedAt?: Date;
}

function toDto(raw: RawReq): RequisitionDto {
  return {
    id: raw._id?.toString() || '',
    _id: raw._id?.toString() || '',
    requisitionId: raw.requisitionId || '',
    hospitalId: raw.hospitalId ? raw.hospitalId.toString() : '',
    patientId: raw.patientId ? raw.patientId.toString() : '',
    clinicianName: raw.clinicianName || '',
    doctorName: raw.doctorName || raw.clinicianName || '',
    patient: raw.patient ? {
      name: raw.patient.name,
      address: raw.patient.address,
      age: raw.patient.age,
      sex: raw.patient.sex,
      mrn: raw.patient.mrn,
      diagnosis: raw.patient.diagnosis,
      indication: raw.patient.indication,
      hb: raw.patient.hb,
      specialNeeds: Array.isArray(raw.patient.specialNeeds) ? raw.patient.specialNeeds : [],
      history: raw.patient.history ? {
        previousTransfusions: raw.patient.history.previousTransfusions ?? 0,
        approximateDate: raw.patient.history.approximateDate || '',
        presenceOfReaction: raw.patient.history.presenceOfReaction || 'None',
      } : undefined,
      pregnancy: raw.patient.pregnancy ? {
        numPregnancies: raw.patient.pregnancy.numPregnancies ?? 0,
        numMiscarriages: raw.patient.pregnancy.numMiscarriages ?? 0,
        numChildrenWithHemolyticDisease: raw.patient.pregnancy.numChildrenWithHemolyticDisease ?? 0,
      } : undefined,
    } : undefined,
    requestedComponents: raw.requestedComponents || [],
    matchedUnits: raw.matchedUnits || [],
    status: raw.status,
    requiredAt: raw.requiredAt ? new Date(raw.requiredAt).toISOString() : undefined,
    requestedAt: raw.requestedAt ? new Date(raw.requestedAt).toISOString() : raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    rejectionReason: raw.rejectionReason,
    rejectedBy: raw.rejectedBy ? raw.rejectedBy.toString() : undefined,
    rejectedAt: raw.rejectedAt ? new Date(raw.rejectedAt).toISOString() : undefined,
  };
}

export interface CreateRequisitionInput {
  requisitionId: string;
  hospitalId: string;
  patientId: string;
  clinicianName: string;
  doctorName?: string;
  patient?: RequisitionPatientDto;
  requiredAt?: Date;
  requestedComponents: RequestedComponentDto[];
}

export interface ListRequisitionsFilter {
  status?: RequisitionStatus;
  hospitalId?: string;
  patientId?: string;
  search?: string;
  urgency?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  componentType?: ComponentType;
  from?: Date;
  to?: Date;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface RequisitionRepo {
  list(filter: ListRequisitionsFilter): Promise<{ items: RequisitionDto[]; total: number }>;
  create(input: CreateRequisitionInput, actorId: string): Promise<RequisitionDto>;
  findById(id: string): Promise<RequisitionDto>;
  setMatched(id: string, matched: MatchedUnitDto[], actorId: string): Promise<RequisitionDto>;
  setCrossmatchStatus(
    id: string,
    unitId: string,
    status: MatchedUnitDto['crossmatchStatus'],
    actorId: string,
    details?: CrossmatchDetails,
  ): Promise<RequisitionDto>;
  setStatus(id: string, status: RequisitionStatus, actorId: string): Promise<RequisitionDto>;
  reject(id: string, reason: string, actorId: string): Promise<RequisitionDto>;
}

export function createRequisitionRepo(): RequisitionRepo {
  const get = async (id: string): Promise<RawReq> => {
    const raw = (await RequisitionModel.findById(id).lean()) as RawReq | null;
    if (!raw) throw new NotFoundError('Requisition', id);
    return raw;
  };

  return {
    async list(f) {
      const query: Record<string, any> = { deletedAt: null };
      if (f.status) query.status = f.status;
      if (f.hospitalId) query.hospitalId = new Types.ObjectId(f.hospitalId);
      if (f.patientId) query.patientId = new Types.ObjectId(f.patientId);
      if (f.urgency) query['requestedComponents.urgency'] = f.urgency;
      if (f.componentType) query['requestedComponents.componentType'] = f.componentType;

      if (f.from || f.to) {
        query.requestedAt = {};
        if (f.from) query.requestedAt.$gte = f.from;
        if (f.to) query.requestedAt.$lte = f.to;
      }

      if (f.search) {
        query.$or = [
          { requisitionId: { $regex: f.search, $options: 'i' } },
          { 'patient.name': { $regex: f.search, $options: 'i' } },
        ];
      }

      const sortBy = f.sortBy || 'updatedAt';
      const order = f.order === 'asc' ? 1 : -1;
      const sort = { [sortBy]: order } as any;

      const skip = (f.page - 1) * f.limit;
      const [docs, total] = await Promise.all([
        RequisitionModel.find(query)
          .sort(sort)
          .skip(skip)
          .limit(f.limit)
          .lean() as Promise<RawReq[]>,
        RequisitionModel.countDocuments(query),
      ]);
      return { items: (docs as RawReq[]).map(toDto), total };
    },

    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await RequisitionModel.create({
        ...input,
        hospitalId: new Types.ObjectId(input.hospitalId),
        patientId: new Types.ObjectId(input.patientId),
        requestedAt: new Date(),
        status: 'PENDING',
        matchedUnits: [],
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as RawReq);
    },

    async findById(id) {
      return toDto(await get(id));
    },

    async setMatched(id, matched, actorId) {
      const updated = (await RequisitionModel.findByIdAndUpdate(
        id,
        {
          matchedUnits: matched,
          status: 'MATCHED',
          updatedBy: new Types.ObjectId(actorId),
        },
        { new: true },
      ).lean()) as RawReq | null;
      if (!updated) throw new NotFoundError('Requisition', id);
      return toDto(updated);
    },

    async setCrossmatchStatus(id, unitId, status, actorId, details) {
      const setFields: Record<string, unknown> = {
        'matchedUnits.$.crossmatchStatus': status,
        updatedBy: new Types.ObjectId(actorId),
      };
      if (details?.compatibilityResult !== undefined) {
        setFields['matchedUnits.$.compatibilityResult'] = details.compatibilityResult;
      }
      if (details?.crossmatchDoneAt !== undefined) {
        setFields['matchedUnits.$.crossmatchDoneAt'] = details.crossmatchDoneAt;
      }
      if (details?.crossmatchSeenAt !== undefined) {
        setFields['matchedUnits.$.crossmatchSeenAt'] = details.crossmatchSeenAt;
      }
      if (details?.cardNumber !== undefined) {
        setFields['matchedUnits.$.cardNumber'] = details.cardNumber;
      }

      const updated = (await RequisitionModel.findOneAndUpdate(
        { _id: id, 'matchedUnits.unitId': unitId },
        { $set: setFields },
        { new: true },
      ).lean()) as RawReq | null;
      if (!updated) throw new NotFoundError('Requisition matched unit', `${id}/${unitId}`);
      return toDto(updated);
    },

    async setStatus(id, status, actorId) {
      const updated = (await RequisitionModel.findByIdAndUpdate(
        id,
        { status, updatedBy: new Types.ObjectId(actorId) },
        { new: true },
      ).lean()) as RawReq | null;
      if (!updated) throw new NotFoundError('Requisition', id);
      return toDto(updated);
    },

    async reject(id, reason, actorId) {
      const updated = (await RequisitionModel.findByIdAndUpdate(
        id,
        {
          status: 'REJECTED',
          rejectionReason: reason,
          rejectedBy: new Types.ObjectId(actorId),
          rejectedAt: new Date(),
          updatedBy: new Types.ObjectId(actorId),
          matchedUnits: [],
        },
        { new: true },
      ).lean()) as RawReq | null;
      if (!updated) throw new NotFoundError('Requisition', id);
      return toDto(updated);
    },
  };
}
