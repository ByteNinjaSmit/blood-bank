import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import { NotFoundError } from '@/shared/errors';
import type {
  BagInspectionRepo,
  BagInspectionDto,
} from '@/modules/bag-inspection/bag-inspection.repository';
import type {
  CreateBagInspectionInput,
  UpdateBagInspectionReportInput,
  ListBagInspectionInput,
} from '@/modules/bag-inspection/bag-inspection.validator';
import type { GRNRepo } from '@/modules/goods-receipt/goods-receipt.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';

export interface BagInspectionService {
  list(
    q: ListBagInspectionInput,
  ): Promise<{ items: BagInspectionDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<BagInspectionDto>;
  create(input: CreateBagInspectionInput, actorId: string): Promise<BagInspectionDto>;
  updateReport(
    id: string,
    input: UpdateBagInspectionReportInput,
    actorId: string,
  ): Promise<BagInspectionDto>;
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
        bloodGroup: input.bloodGroup,
        actorId,
      });
      log.info(
        { inspectionId, grnId: input.grnId, decision: input.decision, actorId },
        'bag inspection recorded',
      );
      void withAudit(
        { actorId },
        {
          module: 'bag-inspection',
          action: 'CREATE',
          entityType: 'BagInspection',
          entityId: created.id,
          entityLabel: inspectionId,
          severity: input.decision === 'REJECTED' ? 'warning' : 'info',
        },
        undefined,
        { inspectionId, grnId: input.grnId, decision: input.decision },
      );

      // Deduct the sampled bags from batch stock — they are physically sent
      // to the lab and consumed, so they must not remain in usable inventory.
      // We use incrementDamaged (same counter used for torn/broken bags) since
      // "sample consumed by testing" reduces closingStock identically.
      // We look up the batch by batchNumber; if multiple bag-type rows exist
      // for the same batch (rare), we decrement only the first matching row
      // to avoid over-deducting.
      try {
        const stockRows = await deps.bagStock.findByBatch(input.batchNumber);
        if (stockRows.length > 0) {
          const stockRow = stockRows[0]!;
          await deps.bagStock.incrementDamaged(stockRow.id, input.sampleSize, actorId);
          log.info(
            {
              batchNumber: input.batchNumber,
              sampleSize: input.sampleSize,
              stockId: stockRow.stockId,
            },
            'bag inspection: sample bags deducted from batch stock (damagedQty)',
          );
        } else {
          // Batch not yet in stock (inspection filed before batch was accepted) — no-op
          log.warn(
            { batchNumber: input.batchNumber },
            'bag inspection: no BagStock row found for batch — stock not decremented',
          );
        }
      } catch (err) {
        // Stock deduction is best-effort — a failure must not roll back the
        // inspection record that was already committed.
        log.error(
          { err: (err as Error).message, batchNumber: input.batchNumber },
          'bag inspection: failed to decrement batch stock for sample',
        );
      }

      return created;
    },

    async updateReport(id, input, actorId) {
      const inspection = await deps.inspections.findById(id);
      if (!inspection) throw new NotFoundError('BagInspection', id);

      const mergedPhysicalChecks = {
        ...inspection.physicalChecks,
        ...(input.physicalChecks || {}),
      };
      const mergedAnticoagulant =
        input.anticoagulantVolumeOk !== undefined
          ? input.anticoagulantVolumeOk
          : inspection.anticoagulantVolumeOk;
      const mergedPatency =
        input.tubePatency !== undefined ? input.tubePatency : inspection.tubePatency;

      const hasFailedCheck =
        mergedAnticoagulant === false ||
        mergedPatency === false ||
        (mergedPhysicalChecks && Object.values(mergedPhysicalChecks).some((v) => v === false));

      const testResultVal =
        input.testResult !== undefined ? input.testResult : inspection.testResult;
      const hasFailedTestResult =
        testResultVal && /fail|contaminat|leak|broken|reject/i.test(testResultVal);
      const isFailed = Boolean(
        hasFailedCheck ||
        hasFailedTestResult ||
        input.decision === 'REJECTED' ||
        (input.decision === undefined && inspection.decision === 'REJECTED'),
      );
      const decision = isFailed ? 'REJECTED' : 'ACCEPTED';

      const updated = await deps.inspections.update(
        id,
        {
          testingStatus: input.testingStatus || 'REPORT_RECEIVED',
          reportDate: input.reportDate,
          bagNo: input.bagNo,
          segmentNo: input.segmentNo,
          bloodGroup: input.bloodGroup,
          testResult: input.testResult,
          factorVIII: input.factorVIII,
          fibrinogen: input.fibrinogen,
          reportImage: input.reportImage,
          physicalChecks: input.physicalChecks,
          anticoagulantVolumeOk: input.anticoagulantVolumeOk,
          tubePatency: input.tubePatency,
          testingLab: input.testingLab,
          sentDate: input.sentDate,
          decision,
          rejectionReason: isFailed
            ? input.rejectionReason ||
              (input.rejectionReason === ''
                ? ''
                : inspection.rejectionReason || 'Quality check failed')
            : undefined,
        },
        actorId,
      );

      if (!updated) throw new NotFoundError('BagInspection', id);
      log.info({ inspectionId: updated.inspectionId, actorId }, 'bag inspection report updated');
      void withAudit(
        { actorId },
        {
          module: 'bag-inspection',
          action: 'UPDATE',
          entityType: 'BagInspection',
          entityId: id,
          entityLabel: updated.inspectionId,
          severity: isFailed ? 'warning' : 'info',
          reason: updated.rejectionReason,
        },
        { decision: inspection.decision },
        { decision },
      );

      // Batch discard is a derived view (decision === 'REJECTED'), so it
      // already updates itself the moment `decision` changes above — no
      // separate discard entity to create/remove. What must be kept in
      // sync explicitly is BagStock: bags only count as usable inventory
      // once a batch is ACCEPTED, and that must reverse cleanly if a
      // report is later corrected back to REJECTED. This applies to every
      // testingType (not just EMPTY) — the type only selects which QC
      // protocol ran on the sample, not whether the batch counts as stock.
      // Stock is only ever touched inside this method, never at create()
      // time — so "already stocked" means a report was already filed
      // (testingStatus was REPORT_RECEIVED before this call) AND that
      // prior report was accepted. A first-time report filing (status
      // was still SENT) has never touched stock regardless of what the
      // pre-report physical-check decision happened to be.
      const wasStocked =
        inspection.testingStatus === 'REPORT_RECEIVED' && inspection.decision === 'ACCEPTED';
      const nowAccepted = decision === 'ACCEPTED';

      if (nowAccepted !== wasStocked) {
        const grn = await deps.grns.findById(updated.grnId);
        const line = grn?.batchLines.find((l) => l.batchNumber === updated.batchNumber);
        if (line) {
          const stockRows = await deps.bagStock.findByBatch(updated.batchNumber);
          const stockRow = stockRows.find((s) => s.bagType === line.bagType) || stockRows[0];
          const damaged = stockRow?.damagedQty ?? 0;
          const quantityReceived = nowAccepted ? line.quantityReceived : 0;
          const netQty = Math.max(0, quantityReceived - damaged);
          const unopenedBoxes = nowAccepted ? Math.floor(netQty / 45) : 0;
          await deps.bagStock.setReceivedQtyAndBoxes(
            updated.batchNumber,
            line.bagType,
            quantityReceived,
            unopenedBoxes,
            actorId,
          );
          log.info(
            {
              batchNumber: updated.batchNumber,
              bagType: line.bagType,
              quantityReceived,
              nowAccepted,
            },
            nowAccepted
              ? 'batch accepted: bag units added to inventory'
              : 'batch corrected to rejected: bag units removed from inventory',
          );
        }
      }

      return updated;
    },
  };
}
