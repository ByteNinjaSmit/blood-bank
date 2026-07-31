import { Types } from 'mongoose';
import { PatientModel } from '@/modules/patient/patient.model';
import type { AboGroup, RhFactor, SpecialNeed } from '@/shared/enums';
import { NotFoundError } from '@/shared/errors';

export interface PatientDto {
  id: string;
  patientPublicId: string;
  name: string;
  address?: string;
  aboGroup?: AboGroup;
  rhFactor?: RhFactor;
  groupConfirmationCount: number;
  antibodies: string[];
  specialNeeds: SpecialNeed[];
}

interface RawPatient {
  _id: { toString(): string };
  patientPublicId: string;
  name: string;
  address?: string;
  aboGroup?: AboGroup;
  rhFactor?: RhFactor;
  groupConfirmations?: unknown[];
  antibodyHistory?: Array<{ antibody: string }>;
  specialNeeds?: SpecialNeed[];
}

function toDto(raw: RawPatient): PatientDto {
  return {
    id: raw._id.toString(),
    patientPublicId: raw.patientPublicId,
    name: raw.name,
    address: raw.address,
    aboGroup: raw.aboGroup,
    rhFactor: raw.rhFactor,
    groupConfirmationCount: raw.groupConfirmations?.length ?? 0,
    antibodies: (raw.antibodyHistory ?? []).map((a) => a.antibody),
    specialNeeds: raw.specialNeeds ?? [],
  };
}

export interface CreatePatientInput {
  patientPublicId: string;
  name: string;
  address?: string;
  dob?: Date;
  sex?: 'M' | 'F' | 'O';
  medicalRecordNumber?: string;
  aboGroup?: AboGroup;
  rhFactor?: RhFactor;
  specialNeeds?: SpecialNeed[];
}

export interface PatientSnapshotUpdate {
  name: string;
  address?: string;
  dob?: Date;
  sex?: 'M' | 'F' | 'O';
  medicalRecordNumber?: string;
  specialNeeds?: SpecialNeed[];
}

export interface PatientRepo {
  create(input: CreatePatientInput, actorId: string): Promise<PatientDto>;
  /** Throws NotFoundError when absent — never resolves null. */
  findById(id: string): Promise<PatientDto>;
  /**
   * Best-effort sync of the linked Patient record from a requisition's
   * embedded patient snapshot. No-op (resolves silently) if the
   * patient no longer exists — mirrors the original inline behavior.
   */
  updateSnapshot(id: string, fields: PatientSnapshotUpdate): Promise<void>;
}

export function createPatientRepo(): PatientRepo {
  return {
    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await PatientModel.create({ ...input, createdBy: actor, updatedBy: actor });
      return toDto(doc.toObject() as RawPatient);
    },
    async findById(id) {
      const raw = (await PatientModel.findById(id).lean()) as RawPatient | null;
      if (!raw) throw new NotFoundError('Patient', id);
      return toDto(raw);
    },
    async updateSnapshot(id, fields) {
      await PatientModel.findByIdAndUpdate(id, {
        name: fields.name,
        address: fields.address,
        dob: fields.dob,
        sex: fields.sex,
        medicalRecordNumber: fields.medicalRecordNumber,
        specialNeeds: fields.specialNeeds,
      });
    },
  };
}
