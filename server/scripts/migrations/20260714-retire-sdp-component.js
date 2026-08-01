#!/usr/bin/env node
//
// 20260714-retire-sdp-component.js
//
// Retires 'SDP' (Single Donor Platelets) as a component type, and
// 'PLATELETPHERESIS' as a donation type (apheresis donation whose only
// output was SDP). Both were removed from the canonical enums in
// server/src/shared/enums.ts — this migration brings existing documents
// in line so nothing in the DB references a value the app no longer
// understands.
//
// Per CLAUDE.md ("Soft-delete only for clinical records. All deletes
// write an audit entry"), this does NOT hard-delete any document. It:
//
//   BloodUnit    componentType: 'SDP'          -> soft-delete (deletedAt/deletedBy)
//                                                  + AuditLog entry per unit
//   Donation     donationType: 'PLATELETPHERESIS' -> soft-delete (deletedAt/deletedBy)
//                                                  + AuditLog entry per donation
//   Requisition  requestedComponents[]/matchedUnits[] with componentType 'SDP'
//                                               -> left AS-IS, only logged for manual
//                                                  review (a requisition is a patient-care
//                                                  record; rewriting history on it needs a
//                                                  human decision, not a script)
//   BagInspection testingType: 'SDP'           -> left AS-IS, only logged (historical QC
//                                                  record of a bag that really was SDP)
//
// This script is READ + SOFT-WRITE only. It never runs bloodUnits.deleteMany
// or db.collection.drop(). Nothing is unrecoverable — reverse by clearing
// deletedAt/deletedBy on the affected _ids (logged to stdout).
//
// CLI:
//   --dry-run   Read only, print counts. No writes.
//
// Verify after running:
//   db.bloodunits.countDocuments({ componentType: 'SDP', deletedAt: null })   // should be 0
//   db.donations.countDocuments({ donationType: 'PLATELETPHERESIS', deletedAt: null }) // should be 0
//   db.requisitions.aggregate([{ $unwind: '$requestedComponents' }, { $match: { 'requestedComponents.componentType': 'SDP' } }])
//     // review manually — these requisitions still reference SDP historically

'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { parseArgs } = require('node:util');
const mongoose = require('mongoose');

const args = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    actor: { type: 'string', default: 'system-migration' },
  },
});
const DRY_RUN = args.values['dry-run'];
const ACTOR = args.values.actor;

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('[migration] MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8_000 });
  console.log(`[migration] connected. dryRun=${DRY_RUN}`);

  const db = mongoose.connection.db;
  const bloodUnits = db.collection('bloodunits');
  const donations = db.collection('donations');
  const requisitions = db.collection('requisitions');
  const bagInspections = db.collection('baginspections');
  const auditLogs = db.collection('auditlogs');

  const now = new Date();

  // ── 1. BloodUnit: componentType SDP -> soft-delete ─────────────────────────
  const sdpUnits = await bloodUnits
    .find({ componentType: 'SDP', deletedAt: null })
    .project({ _id: 1, unitId: 1 })
    .toArray();
  console.log(
    `[migration] BloodUnit componentType=SDP, not yet deleted: ${sdpUnits.length} doc(s)`,
  );

  if (sdpUnits.length > 0 && !DRY_RUN) {
    const res = await bloodUnits.updateMany(
      { _id: { $in: sdpUnits.map((u) => u._id) } },
      { $set: { deletedAt: now, deletedBy: ACTOR, deleteReason: 'SDP component type retired' } },
    );
    console.log(`[migration] soft-deleted ${res.modifiedCount} BloodUnit doc(s)`);

    const auditDocs = sdpUnits.map((u) => ({
      module: 'unit',
      action: 'SOFT_DELETE',
      entityId: u._id,
      entityLabel: u.unitId,
      actorId: ACTOR,
      reason: 'SDP component type retired from system',
      createdAt: now,
    }));
    await auditLogs.insertMany(auditDocs);
    console.log(`[migration] wrote ${auditDocs.length} AuditLog entr(y/ies) for BloodUnit`);
  }

  // ── 2. Donation: donationType PLATELETPHERESIS -> soft-delete ──────────────
  const pheresisDonations = await donations
    .find({ donationType: 'PLATELETPHERESIS', deletedAt: null })
    .project({ _id: 1, donationId: 1 })
    .toArray();
  console.log(
    `[migration] Donation donationType=PLATELETPHERESIS, not yet deleted: ${pheresisDonations.length} doc(s)`,
  );

  if (pheresisDonations.length > 0 && !DRY_RUN) {
    const res = await donations.updateMany(
      { _id: { $in: pheresisDonations.map((d) => d._id) } },
      {
        $set: {
          deletedAt: now,
          deletedBy: ACTOR,
          deleteReason: 'PLATELETPHERESIS donation type retired (SDP-only output)',
        },
      },
    );
    console.log(`[migration] soft-deleted ${res.modifiedCount} Donation doc(s)`);

    const auditDocs = pheresisDonations.map((d) => ({
      module: 'donation',
      action: 'SOFT_DELETE',
      entityId: d._id,
      entityLabel: d.donationId,
      actorId: ACTOR,
      reason:
        'PLATELETPHERESIS donation type retired from system (its only output, SDP, was retired)',
      createdAt: now,
    }));
    await auditLogs.insertMany(auditDocs);
    console.log(`[migration] wrote ${auditDocs.length} AuditLog entr(y/ies) for Donation`);
  }

  // ── 3. Requisition — flag only, no write ────────────────────────────────────
  const reqCount = await requisitions.countDocuments({
    $or: [{ 'requestedComponents.componentType': 'SDP' }, { 'matchedUnits.componentType': 'SDP' }],
  });
  if (reqCount > 0) {
    console.log(
      `[migration] MANUAL REVIEW NEEDED: ${reqCount} Requisition doc(s) reference componentType SDP in ` +
        `requestedComponents/matchedUnits. Left untouched — these are patient-care records; a person should ` +
        `decide whether to cancel/relabel them.`,
    );
  }

  // ── 4. BagInspection — flag only, no write ──────────────────────────────────
  const inspectionCount = await bagInspections.countDocuments({ testingType: 'SDP' });
  if (inspectionCount > 0) {
    console.log(
      `[migration] INFO: ${inspectionCount} BagInspection doc(s) have testingType=SDP. Left untouched — ` +
        `this is a historical QC record of a bag that really was SDP at the time; not a live enum reference.`,
    );
  }

  console.log('[migration] done');
  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        bloodUnitsSoftDeleted: DRY_RUN ? sdpUnits.length : undefined,
        donationsSoftDeleted: DRY_RUN ? pheresisDonations.length : undefined,
        requisitionsNeedingManualReview: reqCount,
        bagInspectionsHistoricalSdp: inspectionCount,
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
