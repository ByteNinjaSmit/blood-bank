import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import type { PORepo, PODto, LineItemDto } from '@/modules/purchase-order/purchase-order.repository';
import type { VendorRepo } from '@/modules/vendor/vendor.repository';
import type {
  CreatePOInput,
  UpdatePOInput,
  ListPOInput,
} from '@/modules/purchase-order/purchase-order.validator';

export interface POService {
  list(q: ListPOInput): Promise<{ items: PODto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<PODto>;
  create(input: CreatePOInput, actorId: string): Promise<PODto>;
  update(id: string, input: UpdatePOInput, actorId: string): Promise<PODto>;
  submit(id: string, actorId: string): Promise<PODto>;
  approve(id: string, actorId: string): Promise<PODto>;
  reject(id: string, rejectionReason: string, actorId: string): Promise<PODto>;
}

function calcTotal(lineItems: LineItemDto[]): number {
  return lineItems.reduce((sum, item) => {
    const base = item.quantityOrdered * (item.unitPriceRs ?? 0);
    const gst = base * ((item.gstPercent ?? 0) / 100);
    return sum + base + gst;
  }, 0);
}

function generatePONumber(): string {
  const now = new Date();
  const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `PO-${yyyymm}-${rand}`;
}

export function createPOService(deps: { pos: PORepo; vendors: VendorRepo }): POService {
  const log = childLogger({ module: 'purchase-order-service' });

  return {
    async list(q) {
      const { items, total } = await deps.pos.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const po = await deps.pos.findById(id);
      if (!po) throw new NotFoundError('PurchaseOrder', id);
      return po;
    },

    async create(input, actorId) {
      const vendor = await deps.vendors.findById(input.vendorId);
      if (!vendor) throw new NotFoundError('Vendor', input.vendorId);

      const poNumber = generatePONumber();
      const totalAmountRs = calcTotal(input.lineItems);
      const created = await deps.pos.create({
        poNumber,
        poDate: input.poDate,
        vendorId: input.vendorId,
        lineItems: input.lineItems,
        totalAmountRs,
        expectedDelivery: input.expectedDelivery,
        manufacturer: input.manufacturer,
        invoiceNo: input.invoiceNo,
        billDate: input.billDate,
        purchaseOfficerId: input.purchaseOfficerId,
        notes: input.notes,
        actorId,
      });
      log.info({ poNumber, actorId }, 'purchase order created');
      return created;
    },

    async update(id, input, actorId) {
      const po = await deps.pos.findById(id);
      if (!po) throw new NotFoundError('PurchaseOrder', id);
      if (po.approvalStatus !== 'DRAFT') {
        throw new ConflictError(`PO can only be edited in DRAFT status (current: ${po.approvalStatus})`);
      }
      const patch: Partial<{ lineItems: LineItemDto[]; totalAmountRs: number; expectedDelivery: Date; manufacturer: string; invoiceNo: string; billDate: Date; notes: string }> = {};
      if (input.lineItems) {
        patch.lineItems = input.lineItems;
        patch.totalAmountRs = calcTotal(input.lineItems);
      }
      if (input.expectedDelivery) patch.expectedDelivery = input.expectedDelivery;
      if (input.manufacturer !== undefined) patch.manufacturer = input.manufacturer;
      if (input.invoiceNo !== undefined) patch.invoiceNo = input.invoiceNo;
      if (input.billDate !== undefined) patch.billDate = input.billDate;
      if (input.notes !== undefined) patch.notes = input.notes;
      const updated = await deps.pos.update(id, patch, actorId);
      if (!updated) throw new NotFoundError('PurchaseOrder', id);
      return updated;
    },

    async submit(id, actorId) {
      const po = await deps.pos.findById(id);
      if (!po) throw new NotFoundError('PurchaseOrder', id);
      if (po.approvalStatus !== 'DRAFT') {
        throw new ConflictError(`PO must be in DRAFT to submit (current: ${po.approvalStatus})`);
      }
      const updated = await deps.pos.updateStatus(id, { approvalStatus: 'PENDING_APPROVAL' }, actorId);
      if (!updated) throw new NotFoundError('PurchaseOrder', id);
      log.info({ poId: id, actorId }, 'purchase order submitted for approval');
      return updated;
    },

    async approve(id, actorId) {
      const po = await deps.pos.findById(id);
      if (!po) throw new NotFoundError('PurchaseOrder', id);
      if (po.approvalStatus !== 'PENDING_APPROVAL') {
        throw new ConflictError(`PO must be in PENDING_APPROVAL to approve (current: ${po.approvalStatus})`);
      }
      const updated = await deps.pos.updateStatus(id, {
        approvalStatus: 'APPROVED',
        approvedById: actorId,
        approvedAt: new Date(),
      }, actorId);
      if (!updated) throw new NotFoundError('PurchaseOrder', id);
      log.info({ poId: id, actorId }, 'purchase order approved');
      return updated;
    },

    async reject(id, rejectionReason, actorId) {
      const po = await deps.pos.findById(id);
      if (!po) throw new NotFoundError('PurchaseOrder', id);
      if (po.approvalStatus !== 'PENDING_APPROVAL') {
        throw new ConflictError(`PO must be in PENDING_APPROVAL to reject (current: ${po.approvalStatus})`);
      }
      const updated = await deps.pos.updateStatus(id, {
        approvalStatus: 'REJECTED',
        rejectionReason,
      }, actorId);
      if (!updated) throw new NotFoundError('PurchaseOrder', id);
      log.warn({ poId: id, rejectionReason, actorId }, 'purchase order rejected');
      return updated;
    },
  };
}
