import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { GRNRepo, GRNDto, BatchLineDto } from '@/modules/goods-receipt/goods-receipt.repository';
import type { PORepo } from '@/modules/purchase-order/purchase-order.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type { CreateGRNInput, UpdateGRNInput, ListGRNInput } from '@/modules/goods-receipt/goods-receipt.validator';

export interface GRNService {
  list(q: ListGRNInput): Promise<{ items: GRNDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<GRNDto>;
  create(input: CreateGRNInput, actorId: string): Promise<GRNDto>;
  update(id: string, input: UpdateGRNInput, actorId: string): Promise<GRNDto>;
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

      const grnNumber = generateGRNNumber();
      const batchLines: BatchLineDto[] = input.batchLines.map((b) => ({
        bagType: b.bagType,
        capacityMl: b.capacityMl,
        anticoagulant: b.anticoagulant,
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate ? b.manufacturingDate.toISOString() : undefined,
        expiryDate: b.expiryDate.toISOString(),
        quantityReceived: b.quantityReceived,
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

      // Upsert BagStock records immediately for each batch line
      const manufacturer = po?.manufacturer ?? created.vendorName;
      for (const line of created.batchLines) {
        if (line.quantityReceived <= 0) continue;
        const stockId = generateStockId();
        await deps.bagStock.upsertFromGRN({
          stockId,
          bagType: line.bagType,
          capacityMl: line.capacityMl,
          anticoagulant: line.anticoagulant,
          manufacturer: manufacturer || 'Unknown Manufacturer',
          batchNumber: line.batchNumber,
          expiryDate: new Date(line.expiryDate),
          grnId: created.id,
          receivedQty: line.quantityReceived,
          actorId,
        });
      }

      log.info({ grnNumber, poId: input.poId, actorId }, 'GRN created and stock updated');
      return created;
    },

    async update(id, input, actorId) {
      const grn = await deps.grns.findById(id);
      if (!grn) throw new NotFoundError('GoodsReceipt', id);

      const patch: Partial<{
        invoiceNo: string;
        billDate: Date;
        transportDetails: string;
        receivedDate: Date;
        batchLines: BatchLineDto[];
        financials: any;
        notes: string;
      }> = {};

      if (input.invoiceNo !== undefined) patch.invoiceNo = input.invoiceNo;
      if (input.billDate !== undefined) patch.billDate = input.billDate;
      if (input.transportDetails !== undefined) patch.transportDetails = input.transportDetails;
      if (input.receivedDate !== undefined) patch.receivedDate = input.receivedDate;
      if (input.financials !== undefined) patch.financials = input.financials;
      if (input.notes !== undefined) patch.notes = input.notes;

      if (input.batchLines !== undefined) {
        patch.batchLines = input.batchLines.map((b) => ({
          bagType: b.bagType,
          capacityMl: b.capacityMl,
          anticoagulant: b.anticoagulant,
          batchNumber: b.batchNumber,
          manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate).toISOString() : undefined,
          expiryDate: new Date(b.expiryDate).toISOString(),
          quantityReceived: b.quantityReceived,
        }));
      }

      const updated = await deps.grns.update(id, patch, actorId);
      if (!updated) throw new NotFoundError('GoodsReceipt', id);

      // Upsert BagStock records for each batch line if batchLines were updated
      if (input.batchLines !== undefined) {
        const po = await deps.pos.findById(updated.poId);
        const manufacturer = po?.manufacturer ?? updated.vendorName;
        for (const line of updated.batchLines) {
          if (line.quantityReceived <= 0) continue;
          const stockId = generateStockId();
          await deps.bagStock.upsertFromGRN({
            stockId,
            bagType: line.bagType,
            capacityMl: line.capacityMl,
            anticoagulant: line.anticoagulant,
            manufacturer: manufacturer || 'Unknown Manufacturer',
            batchNumber: line.batchNumber,
            expiryDate: new Date(line.expiryDate),
            grnId: id,
            receivedQty: line.quantityReceived,
            actorId,
          });
        }
      }

      log.info({ grnId: id, actorId }, 'GRN updated, bag stock updated');
      return updated;
    },
  };
}
