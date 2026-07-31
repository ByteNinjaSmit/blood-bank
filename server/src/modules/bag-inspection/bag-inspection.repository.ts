import { Types } from 'mongoose';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import type { ListBagInspectionInput } from '@/modules/bag-inspection/bag-inspection.validator';

export interface PhysicalChecksDto {
  sealIntact?: boolean;
  noLeakage?: boolean;
  tubeIntegrity?: boolean;
  needleCondition?: boolean;
  labelPresence?: boolean;
  sterilityCheck?: boolean;
  packagingCondition?: boolean;
}

export interface BagInspectionDto {
  id: string;
  inspectionId: string;
  grnId: string;
  stockId?: string;
  batchNumber: string;
  inspectionDate: string;
  inspectedById: string;
  sampleSize: number;
  physicalChecks?: PhysicalChecksDto;
  anticoagulantVolumeOk?: boolean;
  tubePatency?: boolean;
  observation?: string;
  decision: string;
  rejectionReason?: string;
  testingType?: 'EMPTY' | 'WB' | 'PRBC' | 'FFP' | 'RDP' | 'CRYO' | 'OTHER';
  testingStatus?: 'SENT' | 'REPORT_RECEIVED';
  sentDate?: string;
  reportDate?: string;
  testingLab?: string;
  bagNo?: string;
  segmentNo?: string;
  bloodGroup?: string;
  testResult?: string;
  factorVIII?: number;
  fibrinogen?: number;
  reportImage?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }): BagInspectionDto {
  return {
    id: doc._id.toString(),
    inspectionId: doc.inspectionId as string,
    grnId: (doc.grnId as Types.ObjectId).toString(),
    stockId: doc.stockId ? (doc.stockId as Types.ObjectId).toString() : undefined,
    batchNumber: doc.batchNumber as string,
    inspectionDate: (doc.inspectionDate as Date).toISOString(),
    inspectedById: (doc.inspectedById as Types.ObjectId).toString(),
    sampleSize: doc.sampleSize as number,
    physicalChecks: doc.physicalChecks as PhysicalChecksDto | undefined,
    anticoagulantVolumeOk: doc.anticoagulantVolumeOk as boolean | undefined,
    tubePatency: doc.tubePatency as boolean | undefined,
    observation: doc.observation as string | undefined,
    decision: doc.decision as string,
    rejectionReason: doc.rejectionReason as string | undefined,
    testingType: doc.testingType as 'EMPTY' | 'WB' | 'PRBC' | 'FFP' | 'RDP' | 'CRYO' | 'OTHER' | undefined,
    testingStatus: doc.testingStatus as 'SENT' | 'REPORT_RECEIVED' | undefined,
    sentDate: doc.sentDate ? (doc.sentDate as Date).toISOString() : undefined,
    reportDate: doc.reportDate ? (doc.reportDate as Date).toISOString() : undefined,
    testingLab: doc.testingLab as string | undefined,
    bagNo: doc.bagNo as string | undefined,
    segmentNo: doc.segmentNo as string | undefined,
    bloodGroup: doc.bloodGroup as string | undefined,
    testResult: doc.testResult as string | undefined,
    factorVIII: doc.factorVIII as number | undefined,
    fibrinogen: doc.fibrinogen as number | undefined,
    reportImage: (doc.reportImage as string) || undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface BagInspectionRepo {
  list(q: ListBagInspectionInput): Promise<{ items: BagInspectionDto[]; total: number }>;
  findById(id: string): Promise<BagInspectionDto | null>;
  create(doc: {
    inspectionId: string;
    grnId: string;
    stockId?: string;
    batchNumber: string;
    inspectionDate: Date;
    inspectedById: string;
    sampleSize: number;
    physicalChecks?: PhysicalChecksDto;
    anticoagulantVolumeOk?: boolean;
    tubePatency?: boolean;
    observation?: string;
    decision: string;
    rejectionReason?: string;
    testingType?: 'EMPTY' | 'WB' | 'PRBC' | 'FFP' | 'RDP' | 'CRYO' | 'OTHER';
    testingStatus?: 'SENT' | 'REPORT_RECEIVED';
    sentDate?: Date;
    testingLab?: string;
    bagNo?: string;
    segmentNo?: string;
    bloodGroup?: string;
    actorId: string;
  }): Promise<BagInspectionDto>;
  update(id: string, patch: Partial<{
    testingStatus: string;
    reportDate: Date;
    bagNo: string;
    segmentNo: string;
    bloodGroup: string;
    testResult: string;
    factorVIII: number;
    fibrinogen: number;
    reportImage: string | null;
    physicalChecks: PhysicalChecksDto;
    anticoagulantVolumeOk: boolean;
    tubePatency: boolean;
    decision: string;
    rejectionReason: string;
    testingLab: string;
    sentDate: Date;
  }>, actorId: string): Promise<BagInspectionDto | null>;
}

export function createBagInspectionRepo(): BagInspectionRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.grnId) filter.grnId = new Types.ObjectId(q.grnId);
      if (q.batchNumber) filter.batchNumber = q.batchNumber;
      if (q.decision) filter.decision = q.decision;
      if (q.fromDate || q.toDate) {
        const range: Record<string, Date> = {};
        if (q.fromDate) range.$gte = q.fromDate;
        if (q.toDate) range.$lte = q.toDate;
        filter.inspectionDate = range;
      }
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        BagInspectionModel.find(filter).sort({ inspectionDate: -1 }).skip(skip).limit(pageSize).lean(),
        BagInspectionModel.countDocuments(filter),
      ]);
      return { items: docs.map((d) => toDto(d as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date })), total };
    },

    async findById(id) {
      const doc = await BagInspectionModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async create(input) {
      const actor = new Types.ObjectId(input.actorId);
      const doc = await BagInspectionModel.create({
        inspectionId: input.inspectionId,
        grnId: new Types.ObjectId(input.grnId),
        stockId: input.stockId ? new Types.ObjectId(input.stockId) : undefined,
        batchNumber: input.batchNumber,
        inspectionDate: input.inspectionDate,
        inspectedById: new Types.ObjectId(input.inspectedById),
        sampleSize: input.sampleSize,
        physicalChecks: input.physicalChecks,
        anticoagulantVolumeOk: input.anticoagulantVolumeOk,
        tubePatency: input.tubePatency,
        observation: input.observation,
        decision: input.decision,
        rejectionReason: input.rejectionReason,
        testingType: input.testingType,
        testingStatus: input.testingStatus,
        sentDate: input.sentDate,
        testingLab: input.testingLab,
        bagNo: input.bagNo,
        segmentNo: input.segmentNo,
        bloodGroup: input.bloodGroup,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async update(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagInspectionModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { ...patch, updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },
  };
}
