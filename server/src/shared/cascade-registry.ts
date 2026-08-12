// Declarative cascade graphs for the centralized soft-delete system.
// Each root is registered once here and reused by every module's
// remove()/restore() service method via cascadeSoftDelete/cascadeRestore
// (server/src/shared/utils/cascade-delete.ts).
//
// Only the chains explicitly named in scope are registered:
//   Donor -> Donation -> BloodUnit -> {Crossmatch, Issue, Transfusion}
//         -> Donation -> TTI
//         -> Deferral
//
// BloodUnit numbers/component identity are never regenerated or
// deleted — an "unused" unit is moved through the existing state
// machine (DISCARD/REINSTATE), and a unit already issued/transfused is
// marked `affected` and left completely untouched. Crossmatch, Issue,
// and Transfusion represent completed clinical actions and are always
// marked `affected` rather than deleted, preserving traceability.

import { Types, type Model } from 'mongoose';
import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel, type Donation } from '@/modules/donation/donation.model';
import { CampDonationRecordModel } from '@/modules/donation/camp-donation-record.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { CrossmatchModel } from '@/modules/crossmatch/crossmatch.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { VendorModel } from '@/modules/vendor/vendor.model';
import { PurchaseOrderModel } from '@/modules/purchase-order/purchase-order.model';
import { GoodsReceiptModel } from '@/modules/goods-receipt/goods-receipt.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { transition } from '@/modules/unit/unit.state-machine';
import type { UnitStatus } from '@/shared/enums';
import type {
  CascadeContext,
  CascadeNode,
  CascadeRestoreContext,
} from '@/shared/utils/cascade-delete';

// A unit that has already left the bank (or is already in a terminal
// state) must never be silently discarded by an upstream cascade — it
// is marked affected instead, preserving full traceability.
const UNIT_LOCKED_STATUSES = new Set<UnitStatus>([
  'ISSUED',
  'TRANSFUSED',
  'RETURNED_UNUSED',
  'DISCARDED',
  'EXPIRED',
]);

const crossmatchNode: CascadeNode = {
  name: 'crossmatch',
  model: CrossmatchModel,
  linkField: 'unitId',
  linkType: 'businessId',
  parentBusinessIdField: 'unitId',
  // Crossmatch results are completed clinical records — always affected, never deleted.
  isDownstreamLocked: () => true,
};

const issueNode: CascadeNode = {
  name: 'issue',
  model: IssueModel,
  linkField: 'unitId',
  linkType: 'businessId',
  parentBusinessIdField: 'unitId',
  isDownstreamLocked: () => true,
};

const transfusionNode: CascadeNode = {
  name: 'transfusion',
  model: TransfusionModel,
  linkField: 'unitId',
  linkType: 'businessId',
  parentBusinessIdField: 'unitId',
  isDownstreamLocked: () => true,
};

const bloodUnitNode: CascadeNode = {
  name: 'unit',
  model: BloodUnitModel,
  linkField: 'donationId',
  linkType: 'businessId',
  parentBusinessIdField: 'donationId',
  isDownstreamLocked: (doc) => UNIT_LOCKED_STATUSES.has(doc.status as UnitStatus),
  children: [crossmatchNode, issueNode, transfusionNode],
  // Never soft-deleted via deletedAt — moved through the existing
  // state machine instead, so unit numbers/identity are untouched.
  customSoftDelete: async (doc, ctx: CascadeContext) => {
    const nextStatus = transition(doc.status as UnitStatus, 'DISCARD', doc.unitId);
    await BloodUnitModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: nextStatus,
          discardReason: 'CASCADE_DELETED',
          discardNotes: ctx.reason
            ? `Auto-discarded: upstream donation/donor deleted (${ctx.reason})`
            : 'Auto-discarded: upstream donation/donor deleted',
          updatedBy: new Types.ObjectId(ctx.actorId),
          deleteBatchId: ctx.deleteBatchId,
        },
        $push: {
          statusHistory: {
            from: doc.status,
            to: nextStatus,
            event: 'DISCARD',
            actor: new Types.ObjectId(ctx.actorId),
            at: new Date(),
            reason: ctx.reason ?? 'Cascade delete of upstream donation/donor',
          },
        },
      },
      { session: ctx.session ?? undefined },
    );
  },
  customRestore: async (doc, ctx: CascadeRestoreContext) => {
    if (doc.affected) {
      // Locked unit (already issued/transfused) — was never touched
      // beyond the affected-metadata flags. Clear those; status/identity
      // were never modified in the first place.
      await BloodUnitModel.updateOne(
        { _id: doc._id },
        {
          $set: { affected: false, canAutoRecover: true },
          $unset: {
            affectedReason: '',
            affectedByModule: '',
            affectedByRecord: '',
            affectedDate: '',
            deleteBatchId: '',
          },
        },
        { session: ctx.session ?? undefined },
      );
      return;
    }

    if (doc.status !== 'DISCARDED') {
      // Not touched by this cascade at all (e.g. found via a stale
      // deleteBatchId query) — nothing to reverse.
      return;
    }

    const nextStatus = transition('DISCARDED', 'REINSTATE', doc.unitId);
    await BloodUnitModel.updateOne(
      { _id: doc._id },
      {
        $set: { status: nextStatus, updatedBy: new Types.ObjectId(ctx.actorId) },
        $unset: { deleteBatchId: '', discardReason: '', discardNotes: '' },
        $push: {
          statusHistory: {
            from: 'DISCARDED',
            to: nextStatus,
            event: 'REINSTATE',
            actor: new Types.ObjectId(ctx.actorId),
            at: new Date(),
            reason: 'Cascade restore of upstream donation/donor',
          },
        },
      },
      { session: ctx.session ?? undefined },
    );
  },
};

const ttiNode: CascadeNode = {
  name: 'tti',
  model: TtiResultModel,
  linkField: 'donationId',
  linkType: 'businessId',
  parentBusinessIdField: 'donationId',
};

// Mirrors the batch+type lookup donation.service.ts's register() uses to
// consume a bag (BagStock.incrementIssued) when a donation records
// lotNo+typeOfBag. Deleting the donation must reverse exactly that
// increment so the bag count in that batch is restored — never sent to
// discard, never left permanently "issued" once the donation is gone.
function mapBagType(typeOfBag: string | undefined): 'DOUBLE' | 'TRIPLE' | null {
  return typeOfBag === 'DB' ? 'DOUBLE' : typeOfBag === 'TB' ? 'TRIPLE' : null;
}

// Shared by donationNode and campDonationNode — same BagStock reversal
// behavior, only the backing model differs (donation vs camp donation
// record, now physically separate collections).
function makeDonationNode(name: string, model: Model<Donation>): CascadeNode {
  return {
    name,
    model,
    linkField: 'donor',
    linkType: 'objectId',
    children: [bloodUnitNode, ttiNode],
    onSoftDelete: async (doc, ctx: CascadeContext) => {
      if (doc.bagStockIssueReversed || !doc.lotNo || !doc.typeOfBag) return;
      const bagType = mapBagType(doc.typeOfBag);
      if (!bagType) return;
      const bagStock = await BagStockModel.findOne({
        batchNumber: doc.lotNo,
        bagType,
        deletedAt: null,
      }).session(ctx.session);
      if (!bagStock) return;
      await BagStockModel.updateOne(
        { _id: bagStock._id },
        {
          $inc: { issuedQty: -1 },
          $set: { lastUpdatedAt: new Date(), updatedBy: new Types.ObjectId(ctx.actorId) },
        },
        { session: ctx.session ?? undefined },
      );
      await model.updateOne(
        { _id: doc._id },
        { $set: { bagStockIssueReversed: true } },
        { session: ctx.session ?? undefined },
      );
    },
    onRestore: async (doc, ctx: CascadeRestoreContext) => {
      if (!doc.bagStockIssueReversed || !doc.lotNo || !doc.typeOfBag) return;
      const bagType = mapBagType(doc.typeOfBag);
      if (!bagType) return;
      const bagStock = await BagStockModel.findOne({
        batchNumber: doc.lotNo,
        bagType,
        deletedAt: null,
      }).session(ctx.session);
      if (!bagStock) return;
      await BagStockModel.updateOne(
        { _id: bagStock._id },
        {
          $inc: { issuedQty: 1 },
          $set: { lastUpdatedAt: new Date(), updatedBy: new Types.ObjectId(ctx.actorId) },
        },
        { session: ctx.session ?? undefined },
      );
      await model.updateOne(
        { _id: doc._id },
        { $set: { bagStockIssueReversed: false } },
        { session: ctx.session ?? undefined },
      );
    },
  };
}

// Exported so donation.service.ts can reuse the exact same subtree
// (BloodUnit/TTI) when a donation is deleted directly, not only when
// cascading down from a deleted Donor.
export const donationNode: CascadeNode = makeDonationNode('donation', DonationModel);

// Same shape as donationNode, but for camp donations — a separate
// collection (campdonationrecords), so a donor's cascade delete/restore
// must sweep both (see donorCascadeNode below).
export const campDonationNode: CascadeNode = makeDonationNode(
  'camp-donation',
  CampDonationRecordModel,
);

const deferralNode: CascadeNode = {
  name: 'deferral',
  model: DeferralModel,
  linkField: 'donor',
  linkType: 'objectId',
};

export const donorCascadeNode: CascadeNode = {
  name: 'donor',
  model: DonorModel,
  linkField: '_id', // root — unused, cascadeSoftDelete looks the root up directly
  linkType: 'objectId',
  children: [donationNode, campDonationNode, deferralNode],
};

// ── Vendor -> PurchaseOrder -> GoodsReceipt -> {BagInspection, BagStock} ──
//
// BagStock is inventory: deleting the GoodsReceipt that created a batch
// must reverse the exact receivedQty it contributed (atomic $inc,
// reusing the same pattern as bag-stock.repository.ts), unless that
// batch has already been partly issued (issuedQty > 0) — in which case
// it's marked affected and left completely untouched, matching the
// task's dependency-handling rule ("unused inventory may be soft
// deleted; records already participating in downstream workflows
// preserve traceability").

const bagStockNode: CascadeNode = {
  name: 'bag-stock',
  model: BagStockModel,
  linkField: 'grnId',
  linkType: 'objectId',
  isDownstreamLocked: (doc) => (doc.issuedQty ?? 0) > 0,
  onSoftDelete: async (doc, ctx: CascadeContext) => {
    if (!doc.receivedQty) return;
    await BagStockModel.updateOne(
      { _id: doc._id },
      {
        $inc: { receivedQty: -doc.receivedQty },
        $set: {
          reversedReceivedQty: doc.receivedQty,
          lastUpdatedAt: new Date(),
          updatedBy: new Types.ObjectId(ctx.actorId),
        },
      },
      { session: ctx.session ?? undefined },
    );
  },
  onRestore: async (doc, ctx: CascadeRestoreContext) => {
    if (!doc.reversedReceivedQty) return;
    await BagStockModel.updateOne(
      { _id: doc._id },
      {
        $inc: { receivedQty: doc.reversedReceivedQty },
        $set: {
          reversedReceivedQty: 0,
          lastUpdatedAt: new Date(),
          updatedBy: new Types.ObjectId(ctx.actorId),
        },
      },
      { session: ctx.session ?? undefined },
    );
  },
};

const bagInspectionNode: CascadeNode = {
  name: 'bag-inspection',
  model: BagInspectionModel,
  linkField: 'grnId',
  linkType: 'objectId',
  // Inspection records are QC history — always affected, never deleted.
  isDownstreamLocked: () => true,
};

const goodsReceiptNode: CascadeNode = {
  name: 'goods-receipt',
  model: GoodsReceiptModel,
  linkField: 'poId',
  linkType: 'objectId',
  children: [bagInspectionNode, bagStockNode],
};

// Exported so purchase-order.service.ts can reuse this exact subtree
// when a PO is deleted directly, not only when cascading from a
// deleted Vendor.
export const purchaseOrderNode: CascadeNode = {
  name: 'purchase-order',
  model: PurchaseOrderModel,
  linkField: 'vendorId',
  linkType: 'objectId',
  children: [goodsReceiptNode],
};

export const vendorCascadeNode: CascadeNode = {
  name: 'vendor',
  model: VendorModel,
  linkField: '_id',
  linkType: 'objectId',
  children: [purchaseOrderNode],
};

// ── Hospital -> Requisition -> {Crossmatch, Issue} ──
//
// A requisition already ISSUED/COMPLETED means blood has left the bank
// against it — it (and its crossmatch/issue records) must be preserved
// untouched and marked affected, never deleted, matching the task's
// "Hospital -> Requisition -> Crossmatch -> Blood Issue" example.

const crossmatchByRequisitionNode: CascadeNode = {
  name: 'crossmatch',
  model: CrossmatchModel,
  linkField: 'requisitionId',
  linkType: 'objectId',
  isDownstreamLocked: () => true,
};

const issueByRequisitionNode: CascadeNode = {
  name: 'issue',
  model: IssueModel,
  linkField: 'requisitionId',
  linkType: 'objectId',
  isDownstreamLocked: () => true,
};

const requisitionNode: CascadeNode = {
  name: 'requisition',
  model: RequisitionModel,
  linkField: 'hospitalId',
  linkType: 'objectId',
  isDownstreamLocked: (doc) => doc.status === 'ISSUED' || doc.status === 'COMPLETED',
  children: [crossmatchByRequisitionNode, issueByRequisitionNode],
};

export const hospitalCascadeNode: CascadeNode = {
  name: 'hospital',
  model: HospitalModel,
  linkField: '_id',
  linkType: 'objectId',
  children: [requisitionNode],
};
