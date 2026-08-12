/* eslint-disable no-console */
// Fixes SBCK26-D1485 / SBCK26-D1494 (seed-manual-2026-08-sbck.ts): the
// inventory legacy-view repository derives "Bag No" from
// donationMap.get(unit.donationId)?.bagNo || unit.donationId, and
// "Segment No" from donObj?.segmentNo || unit.unitDin || unit.unitId.
// With donationId left as the placeholder "-" and no Donation doc, Bag No
// showed "-" and Segment No fell through to the literal bag number. Setting
// donationId to the bag number fixes Bag No; setting unitDin to "-" stops
// Segment No from falling through to unitId.
//
//   npx tsx scripts/fix-manual-2026-08-sbck-bagno.ts

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { BloodUnitModel } from '@/modules/unit/unit.model';

async function main() {
  const uri = process.env.MONGODB_URI!;
  console.log('connecting', uri.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(uri, { dbName: 'BloodBank', serverSelectionTimeoutMS: 8000 });

  for (const unitId of ['SBCK26-D1485', 'SBCK26-D1494']) {
    const res = await BloodUnitModel.updateOne(
      { unitId },
      { $set: { donationId: unitId, unitDin: '-' } },
    );
    console.log(unitId, res.matchedCount ? 'updated' : 'NOT FOUND');
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('FIX FAILED:', e);
  process.exit(1);
});
