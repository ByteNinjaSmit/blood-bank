#!/usr/bin/env node
//
// 20260713-standardize-component-types.js
//
// Collapses the component-type vocabulary from 9 values down to the 6
// canonical codes (WB, PRBC, FFP, RDP, SDP, CRYO):
//
//   WHOLE_BLOOD          -> WB
//   PLATELET_CONCENTRATE -> RDP
//   CRYOPRECIPITATE      -> CRYO
//   IRRADIATED_PRBC      -> PRBC   (+ specialAttributes/SpecialNeed: IRRADIATED)
//   WASHED_PRBC          -> PRBC   (+ specialAttributes/SpecialNeed: WASHED)
//   LEUKOREDUCED_PRBC    -> PRBC   (+ specialAttributes/SpecialNeed: LEUKOREDUCED)
//   PRBC, SDP            -> unchanged
//
// Touches:
//   BloodUnit.componentType        (+ specialAttributes for the 3 collapsed variants)
//   Requisition.requestedComponents[].componentType
//   Requisition.matchedUnits[].componentType
//   BagInspection.testingType      (PC -> RDP only; EMPTY/WB/PRBC/FFP/SDP/CRYO/OTHER untouched)
//   BulkTransfer.items[].componentType (free-text normalization, case-insensitive;
//     unrecognized values are logged for manual review, never guessed)
//
// Does NOT touch unitId / productCode strings — those are immutable
// historical identifiers (e.g. "...-IRR-PRBC-1"), not live enum values.
//
// Idempotent: every update filters on the OLD value, so re-running after a
// partial run is safe — already-migrated docs simply match zero old-value
// filters and are skipped.
//
// CLI:
//   --dry-run   Read only, print before/after counts. No writes.
//
// Verify after running:
//   db.bloodunits.distinct('componentType')      // should be subset of [WB,PRBC,FFP,RDP,SDP,CRYO]
//   db.requisitions.aggregate([{ $unwind: '$requestedComponents' }, { $group: { _id: '$requestedComponents.componentType', c: { $sum: 1 } } }])
//   db.baginspections.distinct('testingType')    // should never include 'PC'
//   db.bulktransfers.aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.componentType', c: { $sum: 1 } } }])

'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { parseArgs } = require('node:util');
const mongoose = require('mongoose');

const args = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
  },
});
const DRY_RUN = args.values['dry-run'];

// Straight value-rename map (BloodUnit non-PRBC-variant, Requisition, BulkTransfer canonical hits).
const RENAME = {
  WHOLE_BLOOD: 'WB',
  PLATELET_CONCENTRATE: 'RDP',
  CRYOPRECIPITATE: 'CRYO',
};

// PRBC variants that collapse into plain PRBC + a SpecialNeed flag.
const PRBC_VARIANT_TO_SPECIAL_NEED = {
  IRRADIATED_PRBC: 'IRRADIATED',
  WASHED_PRBC: 'WASHED',
  LEUKOREDUCED_PRBC: 'LEUKOREDUCED',
};

// BulkTransfer.items[].componentType is unconstrained free text historically —
// normalize known variants case-insensitively. Anything not recognized here is
// left untouched and logged for manual review.
const BULK_TRANSFER_VARIANTS = [
  { canonical: 'PRBC', variants: ['rbc', 'packed cells', 'packed rbc', 'packed red cells', 'pcv', 'prbc'] },
  { canonical: 'RDP', variants: ['platelet', 'platelets', 'platelet concentrate', 'pc', 'rdp'] },
  { canonical: 'WB', variants: ['whole blood', 'wb'] },
  { canonical: 'CRYO', variants: ['cryo', 'cryoprecipitate'] },
  { canonical: 'FFP', variants: ['ffp'] },
  { canonical: 'SDP', variants: ['sdp'] },
];

function normalizeBulkTransferComponentType(raw) {
  if (typeof raw !== 'string') return { canonical: null, recognized: false };
  const lower = raw.trim().toLowerCase();
  for (const { canonical, variants } of BULK_TRANSFER_VARIANTS) {
    if (variants.includes(lower)) return { canonical, recognized: true };
  }
  return { canonical: null, recognized: false };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('[migration] MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8_000 });
  console.log(`[migration] connected. dryRun=${DRY_RUN}`);

  const db = mongoose.connection.db;
  const bloodUnits = db.collection('bloodunits');
  const requisitions = db.collection('requisitions');
  const bagInspections = db.collection('baginspections');
  const bulkTransfers = db.collection('bulktransfers');

  // ── 1. BloodUnit ───────────────────────────────────────────────────────────
  const unitCounts = { renamed: 0, prbcVariantCollapsed: 0 };

  for (const [oldType, newType] of Object.entries(RENAME)) {
    const count = await bloodUnits.countDocuments({ componentType: oldType });
    console.log(`[migration] BloodUnit.componentType ${oldType} -> ${newType}: ${count} doc(s)`);
    if (count > 0 && !DRY_RUN) {
      const res = await bloodUnits.updateMany({ componentType: oldType }, { $set: { componentType: newType } });
      unitCounts.renamed += res.modifiedCount;
    } else {
      unitCounts.renamed += count;
    }
  }

  for (const [variant, specialNeed] of Object.entries(PRBC_VARIANT_TO_SPECIAL_NEED)) {
    const count = await bloodUnits.countDocuments({ componentType: variant });
    console.log(`[migration] BloodUnit.componentType ${variant} -> PRBC (+specialAttributes: ${specialNeed}): ${count} doc(s)`);
    if (count > 0 && !DRY_RUN) {
      const res = await bloodUnits.updateMany(
        { componentType: variant },
        {
          $set: { componentType: 'PRBC' },
          $addToSet: { specialAttributes: specialNeed },
        },
      );
      unitCounts.prbcVariantCollapsed += res.modifiedCount;
    } else {
      unitCounts.prbcVariantCollapsed += count;
    }
  }

  // ── 2. Requisition ───────────────────────────────────────────────────────────
  const requisitionCounts = { requestedComponents: 0, matchedUnits: 0 };
  const allOldValues = [...Object.keys(RENAME), ...Object.keys(PRBC_VARIANT_TO_SPECIAL_NEED)];
  const toNewComponentType = (old) => RENAME[old] ?? (PRBC_VARIANT_TO_SPECIAL_NEED[old] ? 'PRBC' : old);

  for (const oldType of allOldValues) {
    const newType = toNewComponentType(oldType);

    const reqCount = await requisitions.countDocuments({ 'requestedComponents.componentType': oldType });
    console.log(`[migration] Requisition.requestedComponents[].componentType ${oldType} -> ${newType}: ${reqCount} doc(s)`);
    if (reqCount > 0 && !DRY_RUN) {
      const res = await requisitions.updateMany(
        { 'requestedComponents.componentType': oldType },
        { $set: { 'requestedComponents.$[rc].componentType': newType } },
        { arrayFilters: [{ 'rc.componentType': oldType }] },
      );
      requisitionCounts.requestedComponents += res.modifiedCount;
    } else {
      requisitionCounts.requestedComponents += reqCount;
    }

    const matchedCount = await requisitions.countDocuments({ 'matchedUnits.componentType': oldType });
    console.log(`[migration] Requisition.matchedUnits[].componentType ${oldType} -> ${newType}: ${matchedCount} doc(s)`);
    if (matchedCount > 0 && !DRY_RUN) {
      const res = await requisitions.updateMany(
        { 'matchedUnits.componentType': oldType },
        { $set: { 'matchedUnits.$[mu].componentType': newType } },
        { arrayFilters: [{ 'mu.componentType': oldType }] },
      );
      requisitionCounts.matchedUnits += res.modifiedCount;
    } else {
      requisitionCounts.matchedUnits += matchedCount;
    }
  }

  // ── 3. BagInspection ─────────────────────────────────────────────────────────
  const pcCount = await bagInspections.countDocuments({ testingType: 'PC' });
  console.log(`[migration] BagInspection.testingType PC -> RDP: ${pcCount} doc(s)`);
  let bagInspectionUpdated = pcCount;
  if (pcCount > 0 && !DRY_RUN) {
    const res = await bagInspections.updateMany({ testingType: 'PC' }, { $set: { testingType: 'RDP' } });
    bagInspectionUpdated = res.modifiedCount;
  }

  // ── 4. BulkTransfer (free-text normalization) ─────────────────────────────────
  const bulkTransferDocs = await bulkTransfers.find({ 'items.0': { $exists: true } }).toArray();
  let bulkTransferItemsUpdated = 0;
  const unrecognized = new Set();

  for (const doc of bulkTransferDocs) {
    let changed = false;
    const items = (doc.items || []).map((item) => {
      // Already canonical — leave untouched (covers FFP/SDP-as-is and idempotent re-runs).
      const isAlreadyCanonical = ['WB', 'PRBC', 'FFP', 'RDP', 'SDP', 'CRYO'].includes(item.componentType);
      if (isAlreadyCanonical) return item;

      const { canonical, recognized } = normalizeBulkTransferComponentType(item.componentType);
      if (recognized && canonical !== item.componentType) {
        changed = true;
        bulkTransferItemsUpdated++;
        return { ...item, componentType: canonical };
      }
      if (!recognized) {
        unrecognized.add(String(item.componentType));
      }
      return item;
    });

    if (changed && !DRY_RUN) {
      await bulkTransfers.updateOne({ _id: doc._id }, { $set: { items } });
    }
  }

  console.log(`[migration] BulkTransfer.items[].componentType normalized: ${bulkTransferItemsUpdated} item(s)`);
  if (unrecognized.size > 0) {
    console.log(
      `[migration] BulkTransfer.items[].componentType UNRECOGNIZED values (left unchanged, needs manual review): ${[...unrecognized].join(', ')}`,
    );
  }

  console.log('[migration] done');
  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        bloodUnit: unitCounts,
        requisition: requisitionCounts,
        bagInspectionTestingTypeUpdated: bagInspectionUpdated,
        bulkTransferItemsUpdated,
        bulkTransferUnrecognizedValues: [...unrecognized],
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[migration] fatal', err);
  process.exitCode = 1;
});
