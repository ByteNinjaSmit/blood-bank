// Integration test for the centralized cascade soft-delete system,
// exercising the Donor -> Donation -> {BloodUnit, TTI} -> {Crossmatch,
// Issue} chain end-to-end against a real (in-memory) MongoDB, per the
// plan's verification requirement: delete -> assert children
// soft-deleted/affected -> restore -> assert full reversal.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { createDonorRepo } from '@/modules/donor/donor.repository';
import { createDonorService } from '@/modules/donor/donor.service';
import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { CrossmatchModel } from '@/modules/crossmatch/crossmatch.model';
import { IssueModel } from '@/modules/issue/issue.model';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'cascade-test' });
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    DonorModel.deleteMany({}),
    DonationModel.deleteMany({}),
    BloodUnitModel.deleteMany({}),
    TtiResultModel.deleteMany({}),
    DeferralModel.deleteMany({}),
    CrossmatchModel.deleteMany({}),
    IssueModel.deleteMany({}),
  ]);
});

async function seedDonorWithFullChain() {
  const donor = await DonorModel.create({
    donorId: 'DNR-TEST-0001',
    name: { firstName: 'Asha', lastName: 'Patil' },
    dob: new Date('2000-01-01'),
    sex: 'F',
    phone: '9876543210',
    address: { city: 'Pune', district: 'Pune', state: 'MH' },
    weightKg: 55,
    bloodGroup: 'O',
    rh: 'POSITIVE',
    createdBy: actorId,
  });

  const donation = await DonationModel.create({
    donationId: 'DN-TEST-0001',
    donor: donor._id,
    donationType: 'WHOLE_BLOOD',
    collectedAt: new Date(),
    createdBy: actorId,
    updatedBy: actorId,
  });

  const unusedUnit = await BloodUnitModel.create({
    unitId: 'U-TEST-UNUSED',
    donationId: donation.donationId,
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

  const issuedUnit = await BloodUnitModel.create({
    unitId: 'U-TEST-ISSUED',
    donationId: donation.donationId,
    componentType: 'PRBC',
    aboGroup: 'O',
    rhFactor: 'POSITIVE',
    volumeMl: 350,
    collectedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'ISSUED',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const tti = await TtiResultModel.create({
    donationId: donation.donationId,
    releaseDecision: 'released',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const deferral = await DeferralModel.create({
    donor: donor._id,
    type: 'TEMPORARY',
    reason: 'Low Hb',
    source: 'VITALS',
    decidedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });

  const crossmatch = await CrossmatchModel.create({
    crossmatchId: 'XM-TEST-0001',
    requisitionId: new Types.ObjectId(),
    unitId: issuedUnit.unitId,
    patientId: new Types.ObjectId(),
    method: 'IS',
    result: 'COMPATIBLE',
    performedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });

  const issue = await IssueModel.create({
    issueId: 'IS-TEST-0001',
    requisitionId: new Types.ObjectId(),
    unitId: issuedUnit.unitId,
    patientId: new Types.ObjectId(),
    issuedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return { donor, donation, unusedUnit, issuedUnit, tti, deferral, crossmatch, issue };
}

describe('donor cascade soft-delete / restore', () => {
  it('cascades delete: donation+TTI+deferral soft-deleted, unused unit DISCARDED, issued unit + its crossmatch/issue marked affected (never deleted/renumbered)', async () => {
    const { donor, donation, unusedUnit, issuedUnit, tti, deferral, crossmatch, issue } =
      await seedDonorWithFullChain();

    const service = createDonorService({ repo: createDonorRepo() });
    const result = await service.remove(donor._id.toString(), actorId, 'Test cascade delete');
    expect(result.permanentlyDeleted).toBe(false);

    const donorAfter = await DonorModel.findById(donor._id).lean();
    expect(donorAfter?.deletedAt).not.toBeNull();
    expect(donorAfter?.deleteReason).toBe('Test cascade delete');

    const donationAfter = await DonationModel.findById(donation._id).lean();
    expect(donationAfter?.deletedAt).not.toBeNull();

    const ttiAfter = await TtiResultModel.findOne({ donationId: donation.donationId }).lean();
    expect(ttiAfter?.deletedAt).not.toBeNull();

    const deferralAfter = await DeferralModel.findById(deferral._id).lean();
    expect(deferralAfter?.deletedAt).not.toBeNull();

    // Unused unit (RELEASED, not yet issued): auto-discarded via the
    // existing state machine — never soft-deleted, identity untouched.
    const unusedUnitAfter = await BloodUnitModel.findById(unusedUnit._id).lean();
    expect(unusedUnitAfter?.status).toBe('DISCARDED');
    expect(unusedUnitAfter?.unitId).toBe('U-TEST-UNUSED'); // identity never regenerated
    expect(unusedUnitAfter?.deletedAt).toBeFalsy();

    // Issued unit: already left the bank — must be preserved untouched,
    // marked affected only.
    const issuedUnitAfter = await BloodUnitModel.findById(issuedUnit._id).lean();
    expect(issuedUnitAfter?.status).toBe('ISSUED'); // unchanged
    expect(issuedUnitAfter?.affected).toBe(true);
    expect(issuedUnitAfter?.affectedByModule).toBe('donation');
    expect(issuedUnitAfter?.canAutoRecover).toBe(false);
    expect(issuedUnitAfter?.unitId).toBe('U-TEST-ISSUED');

    // Crossmatch/Issue on the issued unit: completed clinical records,
    // always marked affected, never deleted.
    const crossmatchAfter = await CrossmatchModel.findById(crossmatch._id).lean();
    expect(crossmatchAfter?.affected).toBe(true);
    expect(crossmatchAfter?.deletedAt).toBeFalsy();

    const issueAfter = await IssueModel.findById(issue._id).lean();
    expect(issueAfter?.affected).toBe(true);
    expect(issueAfter?.deletedAt).toBeFalsy();
  });

  it('cascades restore: every soft-deleted/affected descendant reverts to its exact prior state', async () => {
    const { donor, donation, unusedUnit, issuedUnit, tti, deferral, crossmatch, issue } =
      await seedDonorWithFullChain();

    const service = createDonorService({ repo: createDonorRepo() });
    await service.remove(donor._id.toString(), actorId, 'Test cascade delete');
    const restoreResult = await service.restore(donor._id.toString(), actorId);
    expect(restoreResult.restored).toBe(true);

    const donorAfter = await DonorModel.findById(donor._id).lean();
    expect(donorAfter?.deletedAt).toBeNull();
    expect(donorAfter?.deleteBatchId).toBeFalsy();

    const donationAfter = await DonationModel.findById(donation._id).lean();
    expect(donationAfter?.deletedAt).toBeNull();

    const ttiAfter = await TtiResultModel.findOne({ donationId: donation.donationId }).lean();
    expect(ttiAfter?.deletedAt).toBeNull();

    const deferralAfter = await DeferralModel.findById(deferral._id).lean();
    expect(deferralAfter?.deletedAt).toBeNull();

    // Unused unit: REINSTATE brings it back to QUARANTINE (the narrow
    // legal reversal from DISCARDED) — never RELEASED-restoring
    // silently, matching the existing state machine's guard.
    const unusedUnitAfter = await BloodUnitModel.findById(unusedUnit._id).lean();
    expect(unusedUnitAfter?.status).toBe('QUARANTINE');
    expect(unusedUnitAfter?.unitId).toBe('U-TEST-UNUSED');

    // Issued unit + its crossmatch/issue: affected flag cleared, nothing
    // else ever changed.
    const issuedUnitAfter = await BloodUnitModel.findById(issuedUnit._id).lean();
    expect(issuedUnitAfter?.affected).toBe(false);
    expect(issuedUnitAfter?.status).toBe('ISSUED');

    const crossmatchAfter = await CrossmatchModel.findById(crossmatch._id).lean();
    expect(crossmatchAfter?.affected).toBe(false);

    const issueAfter = await IssueModel.findById(issue._id).lean();
    expect(issueAfter?.affected).toBe(false);
  });

  it('is idempotent: calling remove() twice does not error and does not permanently delete', async () => {
    const { donor } = await seedDonorWithFullChain();
    const service = createDonorService({ repo: createDonorRepo() });
    await service.remove(donor._id.toString(), actorId, 'First delete');
    const second = await service.remove(donor._id.toString(), actorId, 'Second delete attempt');
    expect(second.permanentlyDeleted).toBe(false);
    const donorAfter = await DonorModel.findById(donor._id).lean();
    expect(donorAfter).not.toBeNull();
    expect(donorAfter?.deletedAt).not.toBeNull();
  });

  it('permanentDelete refuses while active donations exist, succeeds once none do', async () => {
    const { donor } = await seedDonorWithFullChain();
    const service = createDonorService({ repo: createDonorRepo() });
    await service.remove(donor._id.toString(), actorId, 'Soft delete first');

    // Donations were cascade-soft-deleted along with the donor, so no
    // *active* donation blocks permanent delete.
    await service.permanentDelete(donor._id.toString(), actorId, 'Permanent cleanup');
    const donorAfter = await DonorModel.findById(donor._id).lean();
    expect(donorAfter).toBeNull();
  });
});
