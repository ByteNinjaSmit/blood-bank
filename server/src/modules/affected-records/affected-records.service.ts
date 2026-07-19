// Cross-cutting read: every record currently marked `affected` by the
// centralized cascade soft-delete system (server/src/shared/utils/cascade-delete.ts),
// across every model that participates in a cascade graph. Powers the
// Recycle Bin's "Affected Records" tab.

import { BloodUnitModel } from '@/modules/unit/unit.model';
import { CrossmatchModel } from '@/modules/crossmatch/crossmatch.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';

export interface AffectedRecordDto {
  id: string;
  entityType: string;
  entityLabel: string;
  currentStatus?: string | null;
  affectedReason?: string | null;
  affectedByModule?: string | null;
  affectedByRecord?: string | null;
  affectedDate?: string;
  canAutoRecover: boolean;
}

async function affectedUnits(): Promise<AffectedRecordDto[]> {
  const docs = await BloodUnitModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'BloodUnit',
    entityLabel: d.unitId,
    currentStatus: d.status,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

// Units auto-discarded by a cascade delete (donor/donation removed) are
// never marked `affected` — they were legitimately transitioned through
// the state machine, not preserved-in-place — so they're invisible in
// affectedUnits() above. Surface them separately, keyed by deleteBatchId,
// so staff can see stock that disappeared as a side effect of a delete.
async function affectedCascadeDiscardedUnits(): Promise<AffectedRecordDto[]> {
  const docs = await BloodUnitModel.find({
    deleteBatchId: { $exists: true, $ne: null },
    status: 'DISCARDED',
    affected: { $ne: true },
  }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'BloodUnit',
    entityLabel: d.unitId,
    currentStatus: d.status,
    affectedReason: 'Discarded automatically because its donation/donor record was deleted',
    affectedByModule: 'donor/donation',
    affectedByRecord: d.deleteBatchId,
    affectedDate: (d as any).updatedAt ? new Date((d as any).updatedAt).toISOString() : undefined,
    canAutoRecover: true,
  }));
}

async function affectedCrossmatches(): Promise<AffectedRecordDto[]> {
  const docs = await CrossmatchModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'Crossmatch',
    entityLabel: d.crossmatchId,
    currentStatus: d.result,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

async function affectedIssues(): Promise<AffectedRecordDto[]> {
  const docs = await IssueModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'Issue',
    entityLabel: d.issueId,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

async function affectedTransfusions(): Promise<AffectedRecordDto[]> {
  const docs = await TransfusionModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'Transfusion',
    entityLabel: d.transfusionId,
    currentStatus: d.outcome,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

async function affectedBagStock(): Promise<AffectedRecordDto[]> {
  const docs = await BagStockModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'BagStock',
    entityLabel: `${d.stockId} (batch ${d.batchNumber})`,
    currentStatus: d.status,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

async function affectedBagInspections(): Promise<AffectedRecordDto[]> {
  const docs = await BagInspectionModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'BagInspection',
    entityLabel: d.inspectionId,
    currentStatus: d.decision,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

async function affectedRequisitions(): Promise<AffectedRecordDto[]> {
  const docs = await RequisitionModel.find({ affected: true }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    entityType: 'Requisition',
    entityLabel: d.requisitionId,
    currentStatus: d.status,
    affectedReason: d.affectedReason,
    affectedByModule: d.affectedByModule,
    affectedByRecord: d.affectedByRecord,
    affectedDate: d.affectedDate?.toISOString(),
    canAutoRecover: d.canAutoRecover ?? false,
  }));
}

export const affectedRecordsService = {
  async list(): Promise<AffectedRecordDto[]> {
    const groups = await Promise.all([
      affectedUnits(),
      affectedCascadeDiscardedUnits(),
      affectedCrossmatches(),
      affectedIssues(),
      affectedTransfusions(),
      affectedBagStock(),
      affectedBagInspections(),
      affectedRequisitions(),
    ]);
    return groups.flat().sort((a, b) => (b.affectedDate ?? '').localeCompare(a.affectedDate ?? ''));
  },
};
