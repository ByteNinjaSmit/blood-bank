// Integration test for the Vendor -> PurchaseOrder -> GoodsReceipt ->
// {BagInspection, BagStock} cascade chain, including atomic inventory
// reversal/restoration on BagStock.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { createVendorRepo } from '@/modules/vendor/vendor.repository';
import { createVendorService } from '@/modules/vendor/vendor.service';
import { VendorModel } from '@/modules/vendor/vendor.model';
import { PurchaseOrderModel } from '@/modules/purchase-order/purchase-order.model';
import { GoodsReceiptModel } from '@/modules/goods-receipt/goods-receipt.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'vendor-cascade-test' });
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    VendorModel.deleteMany({}),
    PurchaseOrderModel.deleteMany({}),
    GoodsReceiptModel.deleteMany({}),
    BagInspectionModel.deleteMany({}),
    BagStockModel.deleteMany({}),
  ]);
});

async function seedVendorWithFullChain() {
  const vendor = await VendorModel.create({
    vendorId: 'VND-TEST-0001',
    name: 'Test Vendor',
    manufacturer: 'Test Mfg',
    drugLicenseNo: 'DL-TEST-0001',
    gstNo: 'GST-TEST-0001',
    address: 'Test Address',
    contactPerson: 'Test Person',
    contactPhone: '9999999999',
    approvalStatus: 'APPROVED',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const po = await PurchaseOrderModel.create({
    poNumber: 'PO-TEST-0001',
    poDate: new Date(),
    vendorId: vendor._id,
    lineItems: [
      { bagType: 'SINGLE', capacityMl: 350, anticoagulant: 'CPDA_1', quantityOrdered: 100 },
    ],
    createdBy: actorId,
    updatedBy: actorId,
  });

  const grn = await GoodsReceiptModel.create({
    grnNumber: 'GRN-TEST-0001',
    poId: po._id,
    invoiceNo: 'INV-TEST-0001',
    batchLines: [
      {
        bagType: 'SINGLE',
        capacityMl: 350,
        batchNumber: 'BATCH-0001',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantityReceived: 100,
      },
    ],
    createdBy: actorId,
    updatedBy: actorId,
  });

  const inspection = await BagInspectionModel.create({
    inspectionId: 'INS-TEST-0001',
    grnId: grn._id,
    batchNumber: 'BATCH-0001',
    inspectionDate: new Date(),
    inspectedById: actorId,
    sampleSize: 5,
    decision: 'ACCEPTED',
    createdBy: actorId,
    updatedBy: actorId,
  });

  // Unused stock — nothing issued yet, safe to reverse.
  const unusedStock = await BagStockModel.create({
    stockId: 'STK-TEST-UNUSED',
    bagType: 'SINGLE',
    capacityMl: 350,
    manufacturer: 'Test Mfg',
    batchNumber: 'BATCH-0001',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    grnId: grn._id,
    receivedQty: 100,
    issuedQty: 0,
    createdBy: actorId,
    updatedBy: actorId,
  });

  // Partially issued stock from the same GRN — must be preserved untouched.
  const issuedStock = await BagStockModel.create({
    stockId: 'STK-TEST-ISSUED',
    bagType: 'DOUBLE',
    capacityMl: 450,
    manufacturer: 'Test Mfg',
    batchNumber: 'BATCH-0002',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    grnId: grn._id,
    receivedQty: 50,
    issuedQty: 10,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return { vendor, po, grn, inspection, unusedStock, issuedStock };
}

describe('vendor cascade soft-delete / restore', () => {
  it('cascades delete: PO+GRN soft-deleted, inspection marked affected, unused BagStock receivedQty reversed, issued BagStock preserved+affected', async () => {
    const { vendor, po, grn, inspection, unusedStock, issuedStock } =
      await seedVendorWithFullChain();

    const service = createVendorService({ vendors: createVendorRepo() });
    await service.softDelete(vendor._id.toString(), actorId, 'Test vendor cascade delete');

    const vendorAfter = await VendorModel.findById(vendor._id).lean();
    expect(vendorAfter?.deletedAt).not.toBeNull();

    const poAfter = await PurchaseOrderModel.findById(po._id).lean();
    expect(poAfter?.deletedAt).not.toBeNull();

    const grnAfter = await GoodsReceiptModel.findById(grn._id).lean();
    expect(grnAfter?.deletedAt).not.toBeNull();

    // QC history — always affected, never deleted.
    const inspectionAfter = await BagInspectionModel.findById(inspection._id).lean();
    expect(inspectionAfter?.affected).toBe(true);
    expect(inspectionAfter?.deletedAt).toBeFalsy();

    // Unused stock: soft-deleted AND receivedQty atomically reversed to 0.
    const unusedStockAfter = await BagStockModel.findById(unusedStock._id).lean();
    expect(unusedStockAfter?.deletedAt).not.toBeNull();
    expect(unusedStockAfter?.receivedQty).toBe(0);
    expect(unusedStockAfter?.reversedReceivedQty).toBe(100);

    // Issued stock: already partly consumed — preserved untouched, marked affected only.
    const issuedStockAfter = await BagStockModel.findById(issuedStock._id).lean();
    expect(issuedStockAfter?.affected).toBe(true);
    expect(issuedStockAfter?.deletedAt).toBeFalsy();
    expect(issuedStockAfter?.receivedQty).toBe(50); // untouched
    expect(issuedStockAfter?.issuedQty).toBe(10); // untouched
  });

  it('cascades restore: PO+GRN restored, inspection un-affected, unused BagStock receivedQty restored exactly, issued BagStock un-affected', async () => {
    const { vendor, po, grn, inspection, unusedStock, issuedStock } =
      await seedVendorWithFullChain();

    const service = createVendorService({ vendors: createVendorRepo() });
    await service.softDelete(vendor._id.toString(), actorId, 'Test delete');
    await service.restore(vendor._id.toString(), actorId);

    const vendorAfter = await VendorModel.findById(vendor._id).lean();
    expect(vendorAfter?.deletedAt).toBeNull();

    const poAfter = await PurchaseOrderModel.findById(po._id).lean();
    expect(poAfter?.deletedAt).toBeNull();

    const grnAfter = await GoodsReceiptModel.findById(grn._id).lean();
    expect(grnAfter?.deletedAt).toBeNull();

    const inspectionAfter = await BagInspectionModel.findById(inspection._id).lean();
    expect(inspectionAfter?.affected).toBe(false);

    const unusedStockAfter = await BagStockModel.findById(unusedStock._id).lean();
    expect(unusedStockAfter?.deletedAt).toBeNull();
    expect(unusedStockAfter?.receivedQty).toBe(100); // restored exactly
    expect(unusedStockAfter?.reversedReceivedQty).toBe(0);

    const issuedStockAfter = await BagStockModel.findById(issuedStock._id).lean();
    expect(issuedStockAfter?.affected).toBe(false);
    expect(issuedStockAfter?.receivedQty).toBe(50);
  });

  it('permanentDelete removes the vendor row after soft-delete', async () => {
    const { vendor } = await seedVendorWithFullChain();
    const service = createVendorService({ vendors: createVendorRepo() });
    await service.softDelete(vendor._id.toString(), actorId, 'Soft delete first');
    await service.permanentDelete(vendor._id.toString(), actorId, 'Permanent cleanup');
    const vendorAfter = await VendorModel.findById(vendor._id).lean();
    expect(vendorAfter).toBeNull();
  });
});
