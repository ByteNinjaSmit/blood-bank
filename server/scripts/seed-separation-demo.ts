/* eslint-disable no-console */
// Additive-only demo seed for testing the /component/separate batch
// separation flow. Unlike scripts/seed.ts, this NEVER clears the database —
// it only inserts (and, on rerun, replaces) its own tagged records, so it's
// safe to run against a real working dataset.
//
// Creates N donors + WHOLE_BLOOD donations, each with a single 'WB' unit in
// status COLLECTED (fresh, inside the holding window) so they immediately
// show up on GET /api/v2/component/bags-to-separate. Bag types are weighted
// toward DB/TB/QB since that's what batch separation needs to test against.
//
//   npx tsx scripts/seed-separation-demo.ts [count]

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { UserModel } from '@/modules/user/user.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { getShelfDays } from '@/shared/component-type';

const N = Number(process.argv[2]) || 50;
const TAG = 'SEP-DEMO';

let _seed = 987654321;
const rnd = () => (_seed = (_seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const randInt = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const choice = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;
const pad = (n: number, w = 3) => String(n).padStart(w, '0');
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

const MALE = ['Rahul', 'Vikram', 'Amit', 'Deepak', 'Manoj', 'Suresh', 'Rohit', 'Nikhil', 'Arjun', 'Kiran'];
const FEMALE = ['Anjali', 'Pooja', 'Sunita', 'Kavya', 'Reena', 'Priya', 'Sneha', 'Manisha', 'Aarti', 'Neha'];
const LAST = ['Sharma', 'Patil', 'Singh', 'Joshi', 'Kumar', 'Rao', 'Verma', 'Nair', 'Pawar', 'Shah'];

type ABO = 'O' | 'A' | 'B' | 'AB';
type RH = 'POSITIVE' | 'NEGATIVE';
const ABO_WEIGHTED: ABO[] = [
  ...Array(37).fill('O'),
  ...Array(28).fill('B'),
  ...Array(24).fill('A'),
  ...Array(11).fill('AB'),
] as ABO[];
const rhPick = (): RH => (chance(0.92) ? 'POSITIVE' : 'NEGATIVE');
const aboPick = (): ABO => choice(ABO_WEIGHTED);

// Weighted toward DB/TB/QB — that's what the batch separation UI filters on.
const BAG_TYPES = ['DB', 'DB', 'TB', 'TB', 'QB', 'QB', 'SB'] as const;

async function main() {
  const uri = process.env.MONGODB_URI!;
  console.log('connecting', uri.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(uri, { dbName: 'BloodBank', serverSelectionTimeoutMS: 8000 });
  console.log('connected');

  // Targeted cleanup, scoped only to this script's own tagged records, so
  // reruns are idempotent without touching anything else in the database.
  const staleDonations = await DonationModel.find({ donationId: new RegExp(`^DON-${TAG}-`) })
    .select('donationId')
    .lean();
  const staleDonationIds = staleDonations.map((d) => d.donationId);
  if (staleDonationIds.length) {
    await BloodUnitModel.deleteMany({ donationId: { $in: staleDonationIds } });
    await TtiResultModel.deleteMany({ donationId: { $in: staleDonationIds } });
    await DonationModel.deleteMany({ donationId: { $in: staleDonationIds } });
  }
  const staleDonorCount = await DonorModel.deleteMany({ donorId: new RegExp(`^DNR-${TAG}-`) });
  console.log(
    `cleared previous demo batch: ${staleDonationIds.length} donations, ${staleDonorCount.deletedCount ?? 0} donors`,
  );

  const existingUsers = await UserModel.find({}).select('_id role').lean();
  if (existingUsers.length === 0) {
    console.error('No users found — create at least the system-admin first (scripts/seed-admins.ts). Aborting.');
    process.exit(1);
  }
  const adminUser = existingUsers.find((u) => u.role === 'system-admin') ?? existingUsers[0];
  const phleboUser = existingUsers.find((u) => u.role === 'phlebotomist') ?? adminUser;
  const admin = adminUser._id;
  const phlebo = phleboUser._id;

  const bagTypeCounts: Record<string, number> = {};

  for (let i = 0; i < N; i++) {
    const sex = chance(0.55) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    const ln = choice(LAST);
    const abo = aboPick();
    const rh = rhPick();

    const donor = await DonorModel.create({
      donorId: `DNR-${TAG}-${pad(i + 1)}`,
      name: { firstName: fn, lastName: ln },
      uid: `UID${TAG}${100000 + i}`,
      dob: new Date(1990, randInt(0, 11), randInt(1, 27)),
      sex,
      phone: `+9198${pad(randInt(10000000, 99999999), 8)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${TAG.toLowerCase()}${i}@donor.test`,
      address: {
        line1: `${randInt(1, 200)} Test Path`,
        city: 'Ahmednagar',
        district: 'Ahmednagar',
        state: 'Maharashtra',
        pincode: '414001',
      },
      occupation: 'Tester',
      weightKg: randInt(55, 90),
      bloodGroup: abo,
      rh,
      eligibilityStatus: 'eligible',
      createdBy: admin,
      updatedBy: admin,
    });

    const bagType = choice(BAG_TYPES);
    bagTypeCounts[bagType] = (bagTypeCounts[bagType] ?? 0) + 1;
    // Fresh (inside the holding window) so the Separate screen's countdown
    // and near-expiry views have something meaningful to show.
    const collectedAt = hoursAgo(randInt(0, 3));

    const donation = await DonationModel.create({
      donationId: `DON-${TAG}-${pad(i + 1)}`,
      bagNo: `BAG${TAG}${5000 + i}`,
      segmentNo: `SEG${TAG}${i + 1}`,
      donor: donor._id,
      donationType: 'WHOLE_BLOOD',
      collectedAt,
      phlebotomistId: phlebo,
      medicalExam: {
        weightKg: donor.weightKg,
        hbGdl: 13 + rnd() * 3,
        temperatureCelsius: 36.5 + rnd(),
        pulseBpm: randInt(65, 90),
        bloodPressure: { systolic: randInt(110, 130), diastolic: randInt(70, 88) },
        oxygenSaturationPercent: randInt(96, 100),
        skinClearAtPhlebotomy: true,
        armsFreeOfPunctureScars: true,
        volumeMl: 450,
      },
      donorFitness: { isFit: true },
      typeOfBag: bagType,
      createdBy: phlebo,
      updatedBy: phlebo,
    });

    const shelfDays = getShelfDays('WB');
    const expiresAt = new Date(collectedAt.getTime() + shelfDays * 24 * 60 * 60 * 1000);

    await BloodUnitModel.create({
      unitId: `UNIT-${TAG}-${pad(i + 1, 4)}`,
      donationId: donation.donationId,
      componentType: 'WB',
      aboGroup: abo,
      rhFactor: rh,
      volumeMl: 450,
      collectedAt,
      expiresAt,
      status: 'COLLECTED',
      statusHistory: [{ to: 'COLLECTED', event: 'SEED', actor: admin, at: new Date() }],
      createdBy: phlebo,
      updatedBy: phlebo,
    });

    // Every real donation gets a pending TtiResultModel placeholder at
    // registration time (donation.repository.ts createAtomic()) — the
    // Serology worklist (tti.legacy-view.repository.ts listQuarantined())
    // requires that record to exist before a quarantined bag will show up
    // there, so this seed has to create one too.
    await TtiResultModel.create({
      donationId: donation.donationId,
      aboGroupConfirmed: abo,
      rhFactorConfirmed: rh,
      tests: [],
      releaseDecision: 'pending',
      createdBy: admin,
      updatedBy: admin,
    });
  }

  console.log(`seeded ${N} donors + WHOLE_BLOOD donations, ready on /component/separate`);
  console.log('bag type mix:', bagTypeCounts);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
