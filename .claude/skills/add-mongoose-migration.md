---
name: add-mongoose-migration
description: Author a safe MongoDB migration script for the side-by-side cutover. Use when changing collection shape, splitting one collection into many, or backfilling fields. Migrations are dual-write capable and idempotent.
---

# /add-mongoose-migration

Use when changing the shape of a Mongo collection.

## Rules

- Every migration is **idempotent**. Re-running it must produce the same result.
- Every migration runs in **batches** (default 500 docs) with progress logging.
- Every migration has a `--dry-run` flag that only reads and counts.
- Cutover migrations write to the **new** collection without deleting the old (until the read-switch is proven).
- Never `db.collection.drop()` from a migration. Manual cleanup only.

## Recipe

1. Create `server/scripts/migrations/YYYYMMDD-<short-name>.js`.
2. Imports: connect via `config/db.js`, take CLI flags via `node:util` `parseArgs`.
3. Header doc-comment listing source collection, target collection, fields read, fields written, rollback strategy.
4. Loop in batches:
   ```js
   const cursor = SourceModel.find(query).batchSize(500).cursor();
   for await (const doc of cursor) { ... }
   ```
5. Use `bulkWrite` (`updateOne` with `upsert: true`) on the target — never `insertOne` (so re-runs are safe).
6. Track and print: `read`, `wrote`, `skipped`, `errored`, `elapsedMs`.

## Special case: BloodBag → Donation + BloodUnit + TTIResult

This is the big one. Steps:

1. Read each `BloodBag` doc.
2. Emit one `Donation` doc keyed by `donationId = originalBagNo`.
3. Emit N `BloodUnit` docs (one per component produced) keyed by `unitId = donationId + '-' + componentCode`.
4. Emit one `TTIResult` doc keyed by `donationId`, copying the existing `testResults` array into the new shape.
5. Preserve `_id` traceability — store the original `_id` as `legacyBagId` on `Donation` for lookback queries during transition.

Do not delete `BloodBag` documents. The legacy controllers will keep reading them until the donor + donation features are fully cut over to the new endpoints.
