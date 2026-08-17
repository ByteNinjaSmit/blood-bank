// Regression coverage for the "loan bags don't get requisitioned / give
// loan doesn't work" report investigated during the requisition-workflow
// rewrite. No concrete repro was ever supplied; code review found the
// matching/issue-gate/storage paths already handle loaned units correctly
// (see requisition.service.ts, unit.repository.ts selectable/
// availableForSelection, issue.service.ts's TTI fallback). These tests
// pin that behavior down against a real (in-memory) MongoDB so a future
// change can't silently reintroduce the bug.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { createBulkTransferRepo } from '@/modules/bulk-transfer/bulk-transfer.repository';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { ConflictError } from '@/shared/errors';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'bulk-transfer-loan-test' });
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([BulkTransferModel.deleteMany({}), BloodUnitModel.deleteMany({})]);
});

describe('TAKE_LOAN (bags borrowed in)', () => {
  it('creates a RELEASED unit that is selectable for requisition matching, just like normal stock', async () => {
    const repo = createBulkTransferRepo();
    await repo.create(
      {
        transferId: 'BT-TAKE-0001',
        transferType: 'TAKE_LOAN',
        bloodBankName: 'Sister Bank',
        bloodBankAddress: '123 Elsewhere Rd',
        transferDate: new Date(),
        items: [
          {
            componentType: 'PRBC',
            bloodGroup: 'A+',
            bagNo: 'LOAN-BAG-0001',
            volumeMl: 350,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      actorId,
    );

    const units = await BloodUnitModel.find({ 'loanedFrom.transferId': 'BT-TAKE-0001' }).lean();
    expect(units).toHaveLength(1);
    expect(units[0]!.status).toBe('RELEASED');
    expect(units[0]!.aboGroup).toBe('A');
    expect(units[0]!.rhFactor).toBe('POSITIVE');
    expect(units[0]!.loanedFrom?.bagNo).toBe('LOAN-BAG-0001');

    // The exact query requisition.service.ts's match() uses to propose bags.
    const units$ = createUnitRepo();
    const candidates = await units$.selectable({
      componentType: 'PRBC',
      aboGroups: ['A'] as any,
    });
    expect(candidates.some((c) => c.unitId === units[0]!.unitId)).toBe(true);
  });
});

describe('GIVE_LOAN (bags lent out)', () => {
  it('flips an in-stock unit to ISSUED, and refuses to lend the same bag out twice', async () => {
    const unit = await BloodUnitModel.create({
      unitId: 'U-GIVE-LOAN-1',
      donationId: 'DN-GIVE-LOAN-1',
      componentType: 'PRBC',
      aboGroup: 'O',
      rhFactor: 'POSITIVE',
      volumeMl: 350,
      collectedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'RELEASED',
      createdBy: actorId,
      updatedBy: actorId,
    });

    const repo = createBulkTransferRepo();
    await repo.create(
      {
        transferId: 'BT-GIVE-0001',
        transferType: 'GIVE_LOAN',
        bloodBankName: 'Sister Bank',
        bloodBankAddress: '123 Elsewhere Rd',
        transferDate: new Date(),
        items: [
          {
            componentType: 'PRBC',
            bloodGroup: 'O+',
            bagNo: 'BAG-0001',
            unitId: unit._id.toString(),
          },
        ],
      },
      actorId,
    );

    const afterFirstLoan = await BloodUnitModel.findById(unit._id).lean();
    expect(afterFirstLoan?.status).toBe('ISSUED');

    // Same bag, second GIVE_LOAN transfer — must be rejected, not silently
    // double-issued.
    await expect(
      repo.create(
        {
          transferId: 'BT-GIVE-0002',
          transferType: 'GIVE_LOAN',
          bloodBankName: 'Another Bank',
          bloodBankAddress: '456 Nowhere Ave',
          transferDate: new Date(),
          items: [
            {
              componentType: 'PRBC',
              bloodGroup: 'O+',
              bagNo: 'BAG-0001',
              unitId: unit._id.toString(),
            },
          ],
        },
        actorId,
      ),
    ).rejects.toThrow(ConflictError);
  });
});
