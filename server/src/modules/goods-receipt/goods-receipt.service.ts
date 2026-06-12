import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { GRNRepo, GRNDto, BatchLineDto } from '@/modules/goods-receipt/goods-receipt.repository';
import type { PORepo } from '@/modules/purchase-order/purchase-order.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type { CreateGRNInput, ListGRNInput } from '@/modules/goods-receipt/goods-receipt.validator';

export interface GRNService {
  list(q: ListGRNInput): Promise<{ items: GRNDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<GRNDto>;
  create(input: CreateGRNInput, actorId: string): Promise<GRNDto>;
  accept(id: string, actorId: string): Promise<GRNDto>;
}

function generateGRNNumber(): string {
  const now = new Date();
  const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `GRN-${yyyymm}-${rand}`;
}

function generateStockId(): string {
  const now = new Date();
  const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `STK-${yyyymm}-${rand}`;
}

export function createGRNService(deps: {
  grns: GRNRepo;
  pos: PORepo;
  bagStock: BagStockRepo;
}): GRNService {
  const log = childLogger({ module: 'goods-receipt-service' });

  return {
    async list(q) {
      const { items, total } = await deps.grns.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const grn = await deps.grns.findById(id);
      if (!grn) throw new NotFoundError('GoodsReceipt', id);
      return grn;
    },

    async create(input, actorId) {
      const po = await deps.pos.findById(input.poId);
      if (!po) throw new NotFoundError('PurchaseOrder', input.poId);
      if (po.approvalStatus !== 'APPROVED') {
        throw new ConflictError(`PO must be APPROVED before creating a GRN (current: ${po.approvalStatus})`);
      }

      const grnNumber = generateGRNNumber();
      const batchLines: BatchLineDto[] = input.batchLines.map((b) => ({
        bagType: b.bagType,
        capacityMl: b.capacityMl,
        anticoagulant: b.anticoagulant,
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate ? b.manufacturingDate.toISOString() : undefined,
        expiryDate: b.expiryDate.toISOString(),
        quantityReceived: b.quantityReceived,
        quantityAccepted: b.quantityAccepted ?? 0,
        quantityRejected: b.quantityRejected ?? 0,
      }));

      const created = await deps.grns.create({
        grnNumber,
        poId: input.poId,
        vendorName: input.vendorName,
        invoiceNo: input.invoiceNo,
        billDate: input.billDate,
        transportDetails: input.transportDetails,
        receivedDate: input.receivedDate,
        receivedById: input.receivedById,
        batchLines,
        financials: input.financials ?? undefined,
        notes: input.notes,
        actorId,
      });

      log.info({ grnNumber, poId: input.poId, actorId }, 'GRN created');
      return created;
    },

    async accept(id, actorId) {
      const grn = await deps.grns.findById(id);
      if (!grn) throw new NotFoundError('GoodsReceipt', id);
      if (grn.status !== 'PENDING') {
        throw new ConflictError(`GRN must be PENDING to accept (current: ${grn.status})`);
      }

      // Determine the vendor's manufacturer from the PO → vendor chain (best effort)
      const po = await deps.pos.findById(grn.poId);
      const manufacturer = po?.vendorName ?? grn.vendorName;

      // Upsert BagStock records for each accepted batch line
      for (const line of grn.batchLines) {
        const acceptedQty = line.quantityAccepted ?? line.quantityReceived;
        if (acceptedQty <= 0) continue;
        const stockId = generateStockId();
        await deps.bagStock.upsertFromGRN({
          stockId,
          bagType: line.bagType,
          capacityMl: line.capacityMl,
          anticoagulant: line.anticoagulant,
          manufacturer,
          batchNumber: line.batchNumber,
          expiryDate: new Date(line.expiryDate),
          grnId: id,
          receivedQty: acceptedQty,
          actorId,
        });
      }

      const totalAccepted = grn.batchLines.reduce((sum, l) => sum + (l.quantityAccepted ?? l.quantityReceived), 0);
      const totalReceived = grn.batchLines.reduce((sum, l) => sum + l.quantityReceived, 0);
      const newStatus: string = totalAccepted === totalReceived ? 'ACCEPTED' : 'PARTIALLY_ACCEPTED';

      const updated = await deps.grns.updateStatus(id, newStatus, actorId);
      if (!updated) throw new NotFoundError('GoodsReceipt', id);
      log.info({ grnId: id, newStatus, actorId }, 'GRN accepted, bag stock updated');
      return updated;
    },
  };
}
