// Regression: a loan-taken bag (BulkTransfer TAKE_LOAN) used to show up
// twice in Stock (`/inventory/stock`, source=all/loan) — once as its real
// BloodUnit (createUnitsForTakeLoan already creates one on intake, tagged
// via `loanedFrom`) and once more as a separately-constructed row built
// straight from the BulkTransfer document (the old `loanRows` merge). Pin
// down that it now appears exactly once, tagged, with its real intake
// collection date, and behaves like ordinary stock everywhere else.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { createBulkTransferRepo } from '@/modules/bulk-transfer/bulk-transfer.repository';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createInventoryLegacyViewRepo } from '@/modules/inventory/inventory.legacy-view.repository';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'inventory-loan-stock-test' });
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([BulkTransferModel.deleteMany({}), BloodUnitModel.deleteMany({})]);
});

describe('inventory.legacy-view.listStock — loan bags', () => {
  it('shows a taken-in loan bag exactly once, tagged LOAN, with its real intake collection date', async () => {
    const bulkTransferRepo = createBulkTransferRepo();
    const intakeDate = new Date('2026-08-01T00:00:00Z');
    await bulkTransferRepo.create(
      {
        transferId: 'BT-STOCK-0001',
        transferType: 'TAKE_LOAN',
        bloodBankName: 'Sister Bank',
        bloodBankAddress: '123 Elsewhere Rd',
        transferDate: intakeDate,
        items: [
          {
            componentType: 'PRBC',
            bloodGroup: 'A+',
            bagNo: 'LOAN-BAG-STOCK-0001',
            volumeMl: 350,
            collectedAt: intakeDate,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      actorId,
    );

    const inventoryRepo = createInventoryLegacyViewRepo({ units: createUnitRepo() });
    const result = await inventoryRepo.listStock({
      page: 1,
      limit: 50,
      status: 'in-stock',
      source: 'all',
    });

    const matches = result.data.filter((r: any) => r.bag?.bagNo === 'LOAN-BAG-STOCK-0001');
    expect(matches).toHaveLength(1);
    expect(matches[0].source).toBe('LOAN');
    expect(matches[0].isLoan).toBe(true);
    expect(matches[0].bag.donationDate).toBe(intakeDate.toISOString());
  });
});
