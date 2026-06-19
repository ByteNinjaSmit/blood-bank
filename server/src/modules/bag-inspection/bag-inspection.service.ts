import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { NotFoundError } from '@/shared/errors';
import type { BagInspectionRepo, BagInspectionDto } from '@/modules/bag-inspection/bag-inspection.repository';
import type {
  CreateBagInspectionInput,
  UpdateBagInspectionReportInput,
  ListBagInspectionInput,
} from '@/modules/bag-inspection/bag-inspection.validator';
import type { GRNRepo } from '@/modules/goods-receipt/goods-receipt.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';

export interface BagInspectionService {
  list(q: ListBagInspectionInput): Promise<{ items: BagInspectionDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<BagInspectionDto>;
  create(input: CreateBagInspectionInput, actorId: string): Promise<BagInspectionDto>;
  updateReport(id: string, input: UpdateBagInspectionReportInput, actorId: string): Promise<BagInspectionDto>;
}

function generateInspectionId(): string {
  const now = new Date();
  const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `INS-${yyyymm}-${rand}`;
}

export function createBagInspectionService(deps: {
  inspections: BagInspectionRepo;
  grns: GRNRepo;
  bagStock: BagStockRepo;
}): BagInspectionService {
  const log = childLogger({ module: 'bag-inspection-service' });

  return {
    async list(q) {
      const { items, total } = await deps.inspections.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const inspection = await deps.inspections.findById(id);
      if (!inspection) throw new NotFoundError('BagInspection', id);
      return inspection;
    },

    async create(input, actorId) {
      const inspectionId = generateInspectionId();
      const created = await deps.inspections.create({
        inspectionId,
        grnId: input.grnId,
        stockId: input.stockId,
        batchNumber: input.batchNumber,
        inspectionDate: input.inspectionDate,
        inspectedById: input.inspectedById,
        sampleSize: input.sampleSize,
        physicalChecks: input.physicalChecks,
        anticoagulantVolumeOk: input.anticoagulantVolumeOk,
        tubePatency: input.tubePatency,
        observation: input.observation,
        decision: input.decision,
        rejectionReason: input.rejectionReason,
        testingType: input.testingType,
        testingStatus: input.testingType ? 'SENT' : undefined,
        sentDate: input.sentDate,
        testingLab: input.testingLab,
        bagNo: input.bagNo,
        segmentNo: input.segmentNo,
        actorId,
      });
      log.info({ inspectionId, grnId: input.grnId, decision: input.decision, actorId }, 'bag inspection recorded');
      return created;
    },

    async updateReport(id, input, actorId) {
      const inspection = await deps.inspections.findById(id);
      if (!inspection) throw new NotFoundError('BagInspection', id);
      
      const updated = await deps.inspections.update(id, {
        testingStatus: 'REPORT_RECEIVED',
        reportDate: input.reportDate,
        bagNo: input.bagNo,
        segmentNo: input.segmentNo,
        bloodGroup: input.bloodGroup,
        testResult: input.testResult,
        factorVIII: input.factorVIII,
        fibrinogen: input.fibrinogen,
      }, actorId);
      
      if (!updated) throw new NotFoundError('BagInspection', id);
      log.info({ inspectionId: updated.inspectionId, actorId }, 'bag inspection report updated');

      const isFailed = input.testResult && /fail|contaminat|leak|broken|reject/i.test(input.testResult);
      if (updated.testingType === 'EMPTY' && !isFailed) {
        const grn = await deps.grns.findById(updated.grnId);
        if (grn) {
          const line = grn.batchLines.find((l) => l.batchNumber === updated.batchNumber);
          if (line) {
            const quantityReceived = line.quantityReceived;
            const unopenedBoxes = Math.floor(quantityReceived / 45);
            await deps.bagStock.setReceivedQtyAndBoxes(
              updated.batchNumber,
              line.bagType,
              quantityReceived,
              unopenedBoxes,
              actorId
            );
            log.info(
              { batchNumber: updated.batchNumber, bagType: line.bagType, quantityReceived },
              'sterile check passed: bag units added to inventory'
            );
          }
        }
      }

      return updated;
    },
  };
}
