/* eslint-disable no-console */
// One-off migration: moves existing camp donations (Donation docs with
// campId set) out of the `donations` collection into the new, physically
// separate `campdonationrecords` collection (CampDonationRecordModel).
// In-house donations (campId null/absent) are left untouched.
//
// Preserves the original _id so every downstream reference keyed on the
// donation's Mongo _id (BagIssue.donationId, audit log entityId, etc.)
// keeps resolving correctly after the move — only the collection changes.
//
// Run once, against a backed-up database:
//   npx tsx scripts/migrate-camp-donations.ts
//   npx tsx scripts/migrate-camp-donations.ts --dry-run   (report only, no writes)

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { DonationModel } from '@/modules/donation/donation.model';
import { CampDonationRecordModel } from '@/modules/donation/camp-donation-record.model';

const MONGODB_URI = process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;

async function main() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in the environment.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' });
  console.log('Connected.');

  const totalToMove = await DonationModel.countDocuments({ campId: { $exists: true, $ne: null } });
  console.log(
    `Found ${totalToMove} camp donation(s) in 'donations' to move to 'campdonationrecords'.`,
  );
  if (totalToMove === 0) {
    console.log('Nothing to do.');
    await mongoose.disconnect();
    return;
  }
  if (DRY_RUN) {
    console.log('--dry-run: no writes will be made.');
    await mongoose.disconnect();
    return;
  }

  let moved = 0;
  let failed = 0;

  // Process in batches so a large history doesn't hold one giant cursor/
  // transaction open; each individual document move is still atomic
  // (insert-then-delete, only advancing past a doc once both succeed).
  for (;;) {
    const batch = await DonationModel.find({ campId: { $exists: true, $ne: null } })
      .limit(BATCH_SIZE)
      .lean();
    if (batch.length === 0) break;

    for (const doc of batch) {
      try {
        const exists = await CampDonationRecordModel.exists({ _id: doc._id });
        if (!exists) {
          await CampDonationRecordModel.collection.insertOne(doc as any);
        }
        await DonationModel.deleteOne({ _id: doc._id });
        moved += 1;
      } catch (err) {
        failed += 1;
        console.error(`Failed to move donation ${doc._id} (${(doc as any).donationId}):`, err);
      }
    }

    console.log(`Progress: ${moved} moved, ${failed} failed, out of ${totalToMove}.`);
  }

  console.log(`Done. Moved ${moved} camp donation(s), ${failed} failure(s).`);
  if (failed > 0) {
    console.error('Some documents failed to migrate — re-run the script to retry; already-moved documents are skipped.');
    process.exitCode = 1;
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
