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

export interface RequisitionDto {
  id: string;
  requisitionId: string;
  hospitalId: string;
  patientId: string;
  clinicianName: string;
  requestedComponents: RequestedComponentDto[];
  matchedUnits: MatchedUnitDto[];
  status: RequisitionStatus;
  createdAt: string;
}

interface RawReq {
  _id: { toString(): string };
  requisitionId: string;
  hospitalId: { toString(): string };
  patientId: { toString(): string };
  clinicianName: string;
  requestedComponents: RequestedComponentDto[];
  matchedUnits: MatchedUnitDto[];
  status: RequisitionStatus;
  createdAt: Date;
}

function toDto(raw: RawReq): RequisitionDto {
  return {
    id: raw._id.toString(),
    requisitionId: raw.requisitionId,
    hospitalId: raw.hospitalId.toString(),
    patientId: raw.patientId.toString(),
    clinicianName: raw.clinicianName,
    requestedComponents: raw.requestedComponents,
    matchedUnits: raw.matchedUnits,
    status: raw.status,
    createdAt: raw.createdAt.toISOString(),
  };
}

export interface CreateRequisitionInput {
  requisitionId: string;
  hospitalId: string;
  patientId: string;
  clinicianName: string;
  requiredAt?: Date;
  requestedComponents: RequestedComponentDto[];
}

export interface RequisitionRepo {
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
    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await RequisitionModel.create({
        ...input,
        hospitalId: new Types.ObjectId(input.hospitalId),
        patientId: new Types.ObjectId(input.patientId),
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
          $set: { 'matchedUnits.$.crossmatchStatus': status, updatedBy: new Types.ObjectId(actorId) },
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
