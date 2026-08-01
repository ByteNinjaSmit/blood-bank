// Integration test for donation.service.ts's own remove/restore/
// permanentDelete when a donation is deleted directly (not via a
// parent Donor cascade) — reuses the same donationNode cascade subtree.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createDonationService } from '@/modules/donation/donation.service';
import { createDonorRepo } from '@/modules/donor/donor.repository';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'donation-cascade-test' });
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
  ]);
});

async function seedDonationWithUnit() {
  const donor = await DonorModel.create({
    donorId: 'DNR-DTEST-0001',
    name: { firstName: 'Test', lastName: 'Donor' },
    dob: new Date('2000-01-01'),
    sex: 'M',
    phone: '9000000000',
    address: { city: 'Pune', district: 'Pune', state: 'MH' },
    weightKg: 60,
    bloodGroup: 'A',
    rh: 'POSITIVE',
    createdBy: actorId,
  });

  const donation = await DonationModel.create({
    donationId: 'DN-DTEST-0001',
    donor: donor._id,
    donationType: 'WHOLE_BLOOD',
    collectedAt: new Date(),
    createdBy: actorId,
    updatedBy: actorId,
  });

  const unit = await BloodUnitModel.create({
    unitId: 'U-DTEST-0001',
    donationId: donation.donationId,
    componentType: 'PRBC',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    volumeMl: 350,
    collectedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'RELEASED',
    createdBy: actorId,
    updatedBy: actorId,
  });

  return { donor, donation, unit };
}

describe('donation direct cascade soft-delete / restore', () => {
  const service = () =>
    createDonationService({
      donations: createDonationRepo(),
      donors: createDonorRepo(),
      deferrals: createDeferralRepo(),
    });

  it('deleting a donation directly cascades to its unit (DISCARD) and requires a reason to succeed', async () => {
    const { donation, unit } = await seedDonationWithUnit();
    await service().remove(donation._id.toString(), actorId, 'Data entry error');

    const donationAfter = await DonationModel.findById(donation._id).lean();
    expect(donationAfter?.deletedAt).not.toBeNull();
    expect(donationAfter?.deleteReason).toBe('Data entry error');

    const unitAfter = await BloodUnitModel.findById(unit._id).lean();
    expect(unitAfter?.status).toBe('DISCARDED');
    expect(unitAfter?.unitId).toBe('U-DTEST-0001');
  });

  it('restore reverses the donation and its unit', async () => {
    const { donation, unit } = await seedDonationWithUnit();
    const svc = service();
    await svc.remove(donation._id.toString(), actorId, 'Test');
    await svc.restore(donation._id.toString(), actorId);

    const donationAfter = await DonationModel.findById(donation._id).lean();
    expect(donationAfter?.deletedAt).toBeNull();

    const unitAfter = await BloodUnitModel.findById(unit._id).lean();
    expect(unitAfter?.status).toBe('QUARANTINE');
  });

  it('permanentDelete succeeds once the unit has been cascade-discarded', async () => {
    const { donation } = await seedDonationWithUnit();
    const svc = service();
    await svc.remove(donation._id.toString(), actorId, 'Test');
    await svc.permanentDelete(donation._id.toString(), actorId, 'Cleanup');
    const donationAfter = await DonationModel.findById(donation._id).lean();
    expect(donationAfter).toBeNull();
  });
});
