/* eslint-disable no-console */
// One-off additive seed: 2 PRBC blood units requested 2026-08-12.
//   SBCK26-D1485  collected 27/07/2026  expires 07/09/2026
//   SBCK26-D1494  collected 27/07/2026  expires 07/09/2026
// Blood group O+ (both), all other fields left minimal/placeholder.
// Status is RELEASED so both units are immediately requisition-matchable
// (per unit.repository.ts selectable()/availableForSelection() filter:
// status RELEASED, deletedAt null, expiresAt in the future).
//
// Does NOT clear any existing collection — purely additive. Safe to re-run
// (upserts by unitId, so re-running won't create duplicates).
//
//   npx tsx scripts/seed-manual-2026-08-sbck.ts

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { UserModel } from '@/modules/user/user.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';

async function main() {
  const uri = process.env.MONGODB_URI!;
  console.log('connecting', uri.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(uri, { dbName: 'BloodBank', serverSelectionTimeoutMS: 8000 });
  console.log('connected (additive run — no collections cleared)');

  const admin = await UserModel.findOne({ role: 'system-admin' });
  if (!admin) throw new Error('No system-admin user found — cannot set createdBy/updatedBy');

  const bags = [
    { unitId: 'SBCK26-D1485', collectedAt: new Date('2026-07-27'), expiresAt: new Date('2026-09-07') },
    { unitId: 'SBCK26-D1494', collectedAt: new Date('2026-07-27'), expiresAt: new Date('2026-09-07') },
  ];

  for (const bag of bags) {
    const existing = await BloodUnitModel.findOne({ unitId: bag.unitId });
    if (existing) {
      console.log(`skip (already exists): ${bag.unitId}`);
      continue;
    }
    await BloodUnitModel.create({
      unitId: bag.unitId,
      donationId: '-',
      componentType: 'PRBC',
      aboGroup: 'O',
      rhFactor: 'POSITIVE',
      volumeMl: 350,
      collectedAt: bag.collectedAt,
      expiresAt: bag.expiresAt,
      status: 'RELEASED',
      statusHistory: [
        {
          to: 'RELEASED',
          event: 'SEED',
          actor: admin._id,
          at: new Date(),
          reason: 'seed: manual bag entry, 2026-08-12 request',
        },
      ],
      specialAttributes: [],
      createdBy: admin._id,
      updatedBy: admin._id,
    });
    console.log(`created: ${bag.unitId}`);
  }

  console.log('\n=== SEED (additive) COMPLETE ===');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('SEED FAILED:', e);
  process.exit(1);
});
