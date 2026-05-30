#!/usr/bin/env node
//
// 20260530-bag-to-unit.js
//
// Cutover migration: BloodBag (legacy) -> Donation + BloodUnit[] + TtiResult (new).
//
// Source collection:  bloodbags
// Target collections: donations, bloodunits, ttiresults
//
// Strategy:
//   For every BloodBag doc:
//     - upsert one Donation keyed by `donationId = bag.bagNo` (legacy bagNo
//       is unique per donation event); attach legacyBagId = bag._id.
//     - upsert one BloodUnit per component referenced in bag.components;
//       if bag.components is empty, emit one BloodUnit for the whole-blood
//       parent. unitId = `${donationId}-${componentCode}`.
//     - upsert one TtiResult keyed by donationId, copying bag.testResults.
//
// Idempotent: every write is an upsert keyed by a deterministic id.
// Re-running on a partial run resumes safely.
//
// CLI:
//   --dry-run        Read only, print counts.
//   --batch <n>      Batch size (default 500).
//   --from <objId>   Resume from a specific BloodBag _id.
//   --limit <n>      Process at most N bags (debug helper).
//
// Verify after running:
//   db.bloodbags.countDocuments({})
//     === db.donations.countDocuments({ legacyBagId: { $exists: true } })
//   db.bloodunits.countDocuments({ legacyBagId: { $exists: true } })
//     >= db.bloodbags.countDocuments({})  // because >=1 unit per bag
//
// NOTHING IS DELETED. The old bloodbags collection stays live so the
// legacy controllers keep working. Drop it manually only after the
// donor + donation + unit + inventory + requisition features are all
// cut over to the new endpoints and read-confirmed against the new
// collections.

'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { parseArgs } = require('node:util');
const mongoose = require('mongoose');

// Component code mapping. Tweak per real bag types seen in production.
const COMPONENT_CODE_BY_NAME = {
  PRBC: 'PRBC',
  FFP: 'FFP',
  PLATELET_CONCENTRATE: 'PC',
  SDP: 'SDP',
  CRYOPRECIPITATE: 'CRYO',
  IRRADIATED_PRBC: 'IRR-PRBC',
  WASHED_PRBC: 'WASH-PRBC',
  LEUKOREDUCED_PRBC: 'LR-PRBC',
  WHOLE_BLOOD: 'WB',
};

const ABO_LEGACY_TO_NEW = { A: 'A', B: 'B', AB: 'AB', O: 'O' };
const RH_LEGACY_TO_NEW = { Positive: 'POSITIVE', Negative: 'NEGATIVE' };

// Default shelf life if expiryDate is missing on the legacy bag.
const DEFAULT_SHELF_DAYS_BY_COMPONENT = {
  PRBC: 35,
  FFP: 365,
  PLATELET_CONCENTRATE: 5,
  SDP: 5,
  CRYOPRECIPITATE: 365,
  IRRADIATED_PRBC: 14,
  WASHED_PRBC: 1,
  LEUKOREDUCED_PRBC: 35,
  WHOLE_BLOOD: 35,
};

const LEGACY_STATUS_TO_NEW = {
  collected: 'COLLECTED',
  'component-separated': 'COLLECTED', // treated as upstream of QUARANTINE
  testing: 'IN_TESTING',
  passed: 'RELEASED',
  failed: 'DISCARDED',
  quarantined: 'QUARANTINE',
  issued: 'ISSUED',
  discarded: 'DISCARDED',
};

const args = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    batch: { type: 'string', default: '500' },
    from: { type: 'string' },
    limit: { type: 'string' },
  },
});

const DRY_RUN = args.values['dry-run'];
const BATCH_SIZE = Number.parseInt(args.values.batch, 10);
const FROM_ID = args.values.from;
const LIMIT = args.values.limit ? Number.parseInt(args.values.limit, 10) : Number.POSITIVE_INFINITY;

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('[migration] MONGODB_URI not set');
    process.exit(1);
  }

  // Load the legacy and new models. Using require() so we don't need a TS build step.
  const BloodBag = require('../../models/bloodbag-model.js');

  // The new models live under src/. We register the schemas the same way
  // the runtime would, by requiring the compiled JS if present, falling
  // back to a direct schema.compile here. To keep the script self-
  // contained, we declare the minimum schemas inline:
  const { Schema } = mongoose;
  const Donation = mongoose.model('Donation', new Schema({
    donationId: { type: String, required: true, unique: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },
    donor: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
    donationType: String,
    collectedAt: Date,
    siteId: Schema.Types.ObjectId,
    phlebotomistId: Schema.Types.ObjectId,
    medicalExam: Schema.Types.Mixed,
    donorFitness: Schema.Types.Mixed,
    questionnaireFlags: Schema.Types.Mixed,
    notes: String,
    createdBy: Schema.Types.ObjectId,
    updatedBy: Schema.Types.ObjectId,
  }, { timestamps: true }));

  const BloodUnit = mongoose.model('BloodUnit', new Schema({
    unitId: { type: String, required: true, unique: true },
    unitDin: { type: String, default: null },
    productCode: String,
    donationId: { type: String, required: true, index: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },
    componentType: { type: String, required: true },
    aboGroup: String,
    rhFactor: String,
    volumeMl: Number,
    collectedAt: Date,
    expiresAt: Date,
    status: { type: String, required: true, default: 'COLLECTED' },
    specialAttributes: [String],
    siteId: Schema.Types.ObjectId,
    quarantineReason: String,
    discardReason: String,
    createdBy: Schema.Types.ObjectId,
    updatedBy: Schema.Types.ObjectId,
  }, { timestamps: true }));

  const TtiResult = mongoose.model('TtiResult', new Schema({
    donationId: { type: String, required: true, unique: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },
    aboGroupConfirmed: String,
    rhFactorConfirmed: String,
    tests: [Schema.Types.Mixed],
    releaseDecision: { type: String, default: 'pending' },
    decidedBy: Schema.Types.ObjectId,
    decidedAt: Date,
    createdBy: Schema.Types.ObjectId,
    updatedBy: Schema.Types.ObjectId,
  }, { timestamps: true }));

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8_000 });
  console.log(`[migration] connected. dryRun=${DRY_RUN} batch=${BATCH_SIZE}`);

  const filter = FROM_ID ? { _id: { $gte: new mongoose.Types.ObjectId(FROM_ID) } } : {};
  const totalBags = await BloodBag.countDocuments(filter);
  console.log(`[migration] BloodBag candidates: ${totalBags}`);

  const cursor = BloodBag.find(filter).sort({ _id: 1 }).lean().cursor();

  let read = 0;
  let donationsWritten = 0;
  let unitsWritten = 0;
  let ttiWritten = 0;
  let skipped = 0;
  let errored = 0;

  const donationOps = [];
  const unitOps = [];
  const ttiOps = [];

  const SYSTEM_USER = process.env.SYSTEM_USER_ID
    ? new mongoose.Types.ObjectId(process.env.SYSTEM_USER_ID)
    : null;

  const flush = async () => {
    if (DRY_RUN) {
      donationsWritten += donationOps.length;
      unitsWritten += unitOps.length;
      ttiWritten += ttiOps.length;
    } else {
      const promises = [];
      if (donationOps.length) promises.push(Donation.bulkWrite(donationOps, { ordered: false }));
      if (unitOps.length) promises.push(BloodUnit.bulkWrite(unitOps, { ordered: false }));
      if (ttiOps.length) promises.push(TtiResult.bulkWrite(ttiOps, { ordered: false }));
      const results = await Promise.all(promises);
      let i = 0;
      if (donationOps.length) {
        donationsWritten += results[i].upsertedCount + results[i].modifiedCount;
        i++;
      }
      if (unitOps.length) {
        unitsWritten += results[i].upsertedCount + results[i].modifiedCount;
        i++;
      }
      if (ttiOps.length) {
        ttiWritten += results[i].upsertedCount + results[i].modifiedCount;
      }
    }
    donationOps.length = 0;
    unitOps.length = 0;
    ttiOps.length = 0;
  };

  for await (const bag of cursor) {
    if (read >= LIMIT) break;
    try {
      if (!bag.bagNo || !bag.donor) {
        skipped++;
        continue;
      }

      const donationId = bag.bagNo;
      const collectedAt = bag.collectionDate ?? bag.createdAt ?? new Date();
      const actor = bag.createdBy ?? bag.updatedBy ?? SYSTEM_USER;

      donationOps.push({
        updateOne: {
          filter: { donationId },
          update: {
            $setOnInsert: {
              donationId,
              legacyBagId: bag._id,
              donor: bag.donor,
              donationType: mapDonationType(bag.donationType),
              collectedAt,
              siteId: bag.siteId,
              phlebotomistId: bag.createdBy,
              medicalExam: mapMedicalExam(bag.medicalExamination ?? bag.initialVitals),
              donorFitness: bag.donorFitness,
              questionnaireFlags: bag.medicalQuestions,
              notes: undefined,
              createdBy: actor,
              updatedBy: actor,
            },
          },
          upsert: true,
        },
      });

      const expiresAt = bag.expiryDate ?? defaultExpiry(collectedAt, 'WHOLE_BLOOD');
      const newStatus = LEGACY_STATUS_TO_NEW[bag.status] ?? 'COLLECTED';
      const abo = ABO_LEGACY_TO_NEW[bag.bloodGroup] ?? 'O';
      const rh = RH_LEGACY_TO_NEW[bag.rh] ?? 'POSITIVE';

      const components = Array.isArray(bag.components) && bag.components.length > 0
        ? bag.components
        : [{ inferredType: 'WHOLE_BLOOD' }];

      for (const comp of components) {
        const componentType = comp.componentType ?? comp.inferredType ?? 'WHOLE_BLOOD';
        const productCode = COMPONENT_CODE_BY_NAME[componentType] ?? componentType;
        const unitId = `${donationId}-${productCode}`;

        unitOps.push({
          updateOne: {
            filter: { unitId },
            update: {
              $setOnInsert: {
                unitId,
                unitDin: null,
                productCode,
                donationId,
                legacyBagId: bag._id,
                componentType,
                aboGroup: abo,
                rhFactor: rh,
                volumeMl: comp.volumeMl ?? bag.medicalExamination?.volumeGmMl ?? 0,
                collectedAt,
                expiresAt: comp.expiryDate ?? defaultExpiry(collectedAt, componentType),
                status: newStatus,
                specialAttributes: [],
                siteId: bag.siteId,
                quarantineReason: bag.quarantineReason,
                discardReason: bag.status === 'discarded' ? 'EXPIRED' : undefined,
                createdBy: actor,
                updatedBy: actor,
              },
            },
            upsert: true,
          },
        });
      }

      ttiOps.push({
        updateOne: {
          filter: { donationId },
          update: {
            $setOnInsert: {
              donationId,
              legacyBagId: bag._id,
              aboGroupConfirmed: abo,
              rhFactorConfirmed: rh,
              tests: (bag.testResults ?? []).map((t) => ({
                testName: mapTestName(t.test),
                method: 'ELISA',
                result: mapTestResult(t.result),
                technicianId: t.technicianId,
                performedAt: t.testedAt,
              })),
              releaseDecision: deriveReleaseDecision(bag),
              createdBy: actor,
              updatedBy: actor,
            },
          },
          upsert: true,
        },
      });

      read++;
      if (donationOps.length >= BATCH_SIZE) await flush();
    } catch (err) {
      errored++;
      console.error('[migration] error on bag', bag._id?.toString(), err.message);
    }
  }

  await flush();

  console.log('[migration] done');
  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    read,
    donationsWritten,
    unitsWritten,
    ttiWritten,
    skipped,
    errored,
  }, null, 2));

  await mongoose.disconnect();
}

function mapDonationType(legacy) {
  if (!legacy) return 'WHOLE_BLOOD';
  // Legacy: first_time / repeated / last_donation — these are about frequency, not type.
  // We cannot infer the type without component info; default to WHOLE_BLOOD.
  return 'WHOLE_BLOOD';
}

function mapMedicalExam(m) {
  if (!m) return undefined;
  return {
    weightKg: m.weightKg,
    hbGdl: m.hb,
    temperatureCelsius: m.tempC,
    pulseBpm: m.pulse,
    bloodPressure: m.bp,
    hasPedalOedema: m.pedalOedema === 'Yes',
    oxygenSaturationPercent: m.o2Level,
    hasLymphadenopathy: m.lymphadenopathy === 'Yes',
    hasCyanosis: m.cyanosis === 'Yes',
    systemicExamNotes: m.systematicExam,
    skinClearAtPhlebotomy: m.skinDiseaseFreeAtPhlebotomy === 'Yes',
    armsFreeOfPunctureScars: m.armsFreeFromPunctureScars === 'Yes',
    volumeMl: m.volumeGmMl,
  };
}

function defaultExpiry(collectedAt, componentType) {
  const days = DEFAULT_SHELF_DAYS_BY_COMPONENT[componentType] ?? 35;
  const d = new Date(collectedAt);
  d.setDate(d.getDate() + days);
  return d;
}

function mapTestName(legacy) {
  if (!legacy) return 'HIV';
  const u = String(legacy).toUpperCase();
  if (u === 'VDRL') return 'SYPHILIS';
  if (u === 'MP') return 'MALARIA';
  if (u === 'HBSAG') return 'HBSAG';
  return u;
}

function mapTestResult(legacy) {
  if (!legacy) return 'INDETERMINATE';
  const u = String(legacy).toUpperCase();
  if (u === 'NEGATIVE') return 'NEGATIVE';
  if (u === 'REACTIVE') return 'REACTIVE';
  return 'INDETERMINATE';
}

function deriveReleaseDecision(bag) {
  if (bag.status === 'passed') return 'released';
  if (bag.status === 'failed' || bag.status === 'discarded') return 'reactive';
  if (bag.status === 'quarantined') return 'on-hold';
  return 'pending';
}

main().catch((err) => {
  console.error('[migration] fatal', err);
  process.exitCode = 1;
});
