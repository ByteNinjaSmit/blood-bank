import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createTtiRepo } from '@/modules/tti/tti.repository';
import { createTtiService } from '@/modules/tti/tti.service';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { DonorModel } from '@/modules/donor/donor.model';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'shadeness-repro' });
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    BloodUnitModel.deleteMany({}),
    TtiResultModel.deleteMany({}),
    DonationModel.deleteMany({}),
    DonorModel.deleteMany({}),
  ]);
});

async function seed(donationId: string, unitStatus: string = 'QUARANTINE') {
  const donor = await DonorModel.create({
    donorId: 'DNR-SHADE-0001',
    name: { firstName: 'Test', lastName: 'Donor' },
    dob: new Date('2000-01-01'),
    sex: 'M',
    phone: '9000000001',
    address: { city: 'Pune', district: 'Pune', state: 'MH' },
    weightKg: 60,
    bloodGroup: 'A',
    rh: 'POSITIVE',
    createdBy: actorId,
  });

  await DonationModel.create({
    donationId,
    donor: donor._id,
    donationType: 'WHOLE_BLOOD',
    collectedAt: new Date(),
    createdBy: actorId,
    updatedBy: actorId,
  });

  await BloodUnitModel.create({
    unitId: 'U-SHADE-0001',
    donationId,
    componentType: 'PRBC',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    volumeMl: 350,
    status: unitStatus,
    collectedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    createdBy: actorId,
    updatedBy: actorId,
  });

  await TtiResultModel.create({
    donationId,
    tests: [
      {
        testName: 'HIV',
        method: 'ELISA',
        result: 'INDETERMINATE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'HBSAG',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'HCV',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'SYPHILIS',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'MALARIA',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
    ],
    releaseDecision: 'indeterminate',
    createdBy: actorId,
    updatedBy: actorId,
  });
}

async function seedReactive(donationId: string) {
  const donor = await DonorModel.create({
    donorId: 'DNR-SHADE-0002',
    name: { firstName: 'Test', lastName: 'Donor' },
    dob: new Date('2000-01-01'),
    sex: 'M',
    phone: '9000000002',
    address: { city: 'Pune', district: 'Pune', state: 'MH' },
    weightKg: 60,
    bloodGroup: 'A',
    rh: 'POSITIVE',
    createdBy: actorId,
  });

  await DonationModel.create({
    donationId,
    donor: donor._id,
    donationType: 'WHOLE_BLOOD',
    collectedAt: new Date(),
    createdBy: actorId,
    updatedBy: actorId,
  });

  await BloodUnitModel.create({
    unitId: 'U-SHADE-0002',
    donationId,
    componentType: 'PRBC',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    volumeMl: 350,
    status: 'DISCARDED',
    discardReason: 'TTI_POSITIVE',
    collectedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    createdBy: actorId,
    updatedBy: actorId,
  });

  await TtiResultModel.create({
    donationId,
    tests: [
      {
        testName: 'HIV',
        method: 'ELISA',
        result: 'REACTIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'HBSAG',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'HCV',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'SYPHILIS',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
      {
        testName: 'MALARIA',
        method: 'ELISA',
        result: 'NEGATIVE',
        technicianId: actorId,
        performedAt: new Date(),
      },
    ],
    releaseDecision: 'reactive',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const deferralRepo = createDeferralRepo();
  await deferralRepo.create(
    {
      donor: donor._id.toString(),
      type: 'PERMANENT',
      reason: 'TTI reactive: HIV reactive',
      source: 'TTI_REACTIVE',
      relatedDonationId: donationId,
    },
    actorId,
  );
}

function service() {
  const units = createUnitRepo();
  return createTtiService({
    tti: createTtiRepo(),
    units,
    deferrals: createDeferralRepo(),
    donations: createDonationRepo(),
  });
}

describe('correcting a shadeness (indeterminate) result', () => {
  for (const unitStatus of ['QUARANTINE', 'COLLECTED', 'IN_TESTING', 'RELEASED']) {
    it(`to reactive does not throw (unit in ${unitStatus})`, async () => {
      await seed(`DN-SHADE-REACTIVE-${unitStatus}`, unitStatus);
      const svc = service();
      await svc.recordAndFinalize(
        `DN-SHADE-REACTIVE-${unitStatus}`,
        [{ testName: 'HIV', method: 'ELISA', result: 'REACTIVE', performedAt: new Date() }],
        actorId,
      );
    });

    it(`to released (negative retest) does not throw (unit in ${unitStatus})`, async () => {
      await seed(`DN-SHADE-RELEASED-${unitStatus}`, unitStatus);
      const svc = service();
      await svc.recordAndFinalize(
        `DN-SHADE-RELEASED-${unitStatus}`,
        [{ testName: 'HIV', method: 'ELISA', result: 'NEGATIVE', performedAt: new Date() }],
        actorId,
      );
    });
  }
});

describe('correcting a reactive (discarded) result down to indeterminate', () => {
  it('reinstates the unit out of DISCARDED into QUARANTINE, not left behind', async () => {
    const donationId = 'DN-REACTIVE-TO-INDETERMINATE';
    await seedReactive(donationId);
    const svc = service();

    await svc.recordAndFinalize(
      donationId,
      [{ testName: 'HIV', method: 'ELISA', result: 'INDETERMINATE', performedAt: new Date() }],
      actorId,
    );

    const unit = await BloodUnitModel.findOne({ donationId }).lean();
    expect(unit?.status).toBe('QUARANTINE');
    expect(unit?.discardReason ?? null).toBeNull();

    const deferrals = createDeferralRepo();
    const reactiveDeferral = await deferrals.findByRelatedDonation(donationId, 'TTI_REACTIVE');
    expect(reactiveDeferral).toBeNull();
    const indeterminateDeferral = await deferrals.findByRelatedDonation(
      donationId,
      'TTI_INDETERMINATE',
    );
    expect(indeterminateDeferral).not.toBeNull();
  });

  it('then correcting to negative releases the unit and clears it out of discard', async () => {
    const donationId = 'DN-REACTIVE-TO-INDETERMINATE-TO-RELEASED';
    await seedReactive(donationId);
    const svc = service();

    await svc.recordAndFinalize(
      donationId,
      [{ testName: 'HIV', method: 'ELISA', result: 'INDETERMINATE', performedAt: new Date() }],
      actorId,
    );
    await svc.recordAndFinalize(
      donationId,
      [{ testName: 'HIV', method: 'ELISA', result: 'NEGATIVE', performedAt: new Date() }],
      actorId,
    );

    const unit = await BloodUnitModel.findOne({ donationId }).lean();
    expect(unit?.status).toBe('RELEASED');
    expect(unit?.discardReason ?? null).toBeNull();
  });
});
