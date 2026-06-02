import { Types } from 'mongoose';
import { IssueModel } from '@/modules/issue/issue.model';

export interface IssueDto {
  id: string;
  issueId: string;
  requisitionId: string;
  unitId: string;
  patientId: string;
  issuedAt: string;
}

interface RawIssue {
  _id: { toString(): string };
  issueId: string;
  requisitionId: { toString(): string };
  unitId: string;
  patientId: { toString(): string };
  issuedAt: Date;
}

function toDto(raw: RawIssue): IssueDto {
  return {
    id: raw._id.toString(),
    issueId: raw.issueId,
    requisitionId: raw.requisitionId.toString(),
    unitId: raw.unitId,
    patientId: raw.patientId.toString(),
    issuedAt: raw.issuedAt.toISOString(),
  };
}

export interface CreateIssueInput {
  issueId: string;
  requisitionId: string;
  unitId: string;
  patientId: string;
  collectedByName?: string;
  transportTempCelsius?: number;
}

export interface IssueRepo {
  create(input: CreateIssueInput, actorId: string): Promise<IssueDto>;
}

export function createIssueRepo(): IssueRepo {
  return {
    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await IssueModel.create({
        issueId: input.issueId,
        requisitionId: new Types.ObjectId(input.requisitionId),
        unitId: input.unitId,
        patientId: new Types.ObjectId(input.patientId),
        collectedByName: input.collectedByName,
        transportTempCelsius: input.transportTempCelsius,
        issuedAt: new Date(),
        issuedBy: actor,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as RawIssue);
    },
  };
}
