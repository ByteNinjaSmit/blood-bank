// One-off data repair: inward (bag-first) donations created before the
// createInwardAtomic() fix (donation.repository.ts) never got a TtiResult
// document, so they never surface on the Serology TTI Testing worklist
// (listQuarantined() matches against TtiResultModel docs, not BloodUnit
// status alone) even after component separation completes. This backfills
// the missing TtiResult for every affected donation still found.
//
// Run once: cd server && npx tsx scripts/backfill-inward-tti.ts
import { connectDb, disconnectDb } from '@/core/db';
import { DonationModel } from '@/modules/donation/donation.model';
import { CampDonationRecordModel } from '@/modules/donation/camp-donation-record.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'backfill-inward-tti' });

async function run() {
  await connectDb();

  for (const Model of [DonationModel, CampDonationRecordModel]) {
    const donations = await Model.find({ registrationMode: 'INWARD', deletedAt: null })
      .select('_id donationId provisionalBloodGroup createdBy')
      .lean();
    if (donations.length === 0) continue;

    const donationIds = donations.map((d) => d.donationId);
    const existingTtiIds = new Set(
      (await TtiResultModel.find({ donationId: { $in: donationIds } }).select('donationId').lean()).map(
        (t) => t.donationId,
      ),
    );
    const missing = donations.filter((d) => !existingTtiIds.has(d.donationId));
    if (missing.length === 0) continue;

    const units = await BloodUnitModel.find({ donationId: { $in: missing.map((d) => d.donationId) } })
      .select('donationId aboGroup rhFactor')
      .lean();
    const unitByDonationId = new Map(units.map((u) => [u.donationId, u]));

    for (const d of missing) {
      const unit = unitByDonationId.get(d.donationId);
      const aboGroupConfirmed = d.provisionalBloodGroup?.aboGroup ?? unit?.aboGroup;
      const rhFactorConfirmed = d.provisionalBloodGroup?.rhFactor ?? unit?.rhFactor;
      if (!aboGroupConfirmed || !rhFactorConfirmed) {
        log.warn({ donationId: d.donationId }, 'skipped — no ABO/Rh available to backfill');
        continue;
      }
      await TtiResultModel.create({
        donationId: d.donationId,
        aboGroupConfirmed,
        rhFactorConfirmed,
        tests: [],
        releaseDecision: 'pending',
        createdBy: d.createdBy,
        updatedBy: d.createdBy,
      });
      log.info({ donationId: d.donationId }, 'backfilled TtiResult');
    }
  }

  await disconnectDb();
}

run()
  .then(() => {
    log.info('done');
    process.exit(0);
  })
  .catch((err) => {
    log.error({ err }, 'backfill failed');
    process.exit(1);
  });
