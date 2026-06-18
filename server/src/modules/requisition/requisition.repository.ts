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
}

export interface MatchedUnitDto {
  unitId: string;
  componentType: ComponentType;
  compatibilityType: 'EXACT' | 'COMPATIBLE';
  crossmatchRequired: boolean;
  crossmatchStatus: 'NOT_REQUIRED' | 'PENDING' | 'COMPATIBLE' | 'INCOMPATIBLE';
}

export interface RequisitionPatientDto {
  name: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  mrn?: string;
  diagnosis?: string;
  indication?: string;
  hb?: number;
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
  medicalOfficerSignature?: string;
  hospitalSeal?: string;
  patient?: RequisitionPatientDto;
  requestedComponents: RequestedComponentDto[];
  matchedUnits: MatchedUnitDto[];
  status: RequisitionStatus;
  requestedAt?: string;
  createdAt: string;
}

interface RawReq {
  _id: { toString(): string };
  requisitionId: string;
  hospitalId: { toString(): string };
  patientId: { toString(): string };
  clinicianName: string;
  doctorName?: string;
  medicalOfficerSignature?: string;
  hospitalSeal?: string;
  patient?: RequisitionPatientDto;
  requestedComponents: RequestedComponentDto[];
  matchedUnits: MatchedUnitDto[];
  status: RequisitionStatus;
  requestedAt?: Date;
  createdAt: Date;
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
    medicalOfficerSignature: raw.medicalOfficerSignature || '',
    hospitalSeal: raw.hospitalSeal || '',
    patient: raw.patient ? {
      name: raw.patient.name,
      age: raw.patient.age,
      sex: raw.patient.sex,
      mrn: raw.patient.mrn,
      diagnosis: raw.patient.diagnosis,
      indication: raw.patient.indication,
      hb: raw.patient.hb,
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
    requestedAt: raw.requestedAt ? new Date(raw.requestedAt).toISOString() : raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
  };
}

export interface CreateRequisitionInput {
  requisitionId: string;
  hospitalId: string;
  patientId: string;
  clinicianName: string;
  doctorName?: string;
  medicalOfficerSignature?: string;
  hospitalSeal?: string;
  patient?: RequisitionPatientDto;
  requiredAt?: Date;
  requestedComponents: RequestedComponentDto[];
}

export interface ListRequisitionsFilter {
  status?: RequisitionStatus;
  hospitalId?: string;
  patientId?: string;
  search?: string;
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

    async setCrossmatchStatus(id, unitId, status, actorId) {
      const updated = (await RequisitionModel.findOneAndUpdate(
        { _id: id, 'matchedUnits.unitId': unitId },
        {
          $set: {
            'matchedUnits.$.crossmatchStatus': status,
            updatedBy: new Types.ObjectId(actorId),
          },
        },
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
        },
        { new: true },
      ).lean()) as RawReq | null;
      if (!updated) throw new NotFoundError('Requisition', id);
      return toDto(updated);
    },
  };
}
