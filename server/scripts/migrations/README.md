# server/scripts/migrations

Online-dual-write Mongo migrations for the side-by-side cutover.

## Rules

- Every migration is **idempotent**. Re-running it produces the same result.
- Every migration runs in **batches** (default 500 docs) with progress logging.
- Every migration accepts `--dry-run` (reads only, counts what it would write).
- Cutover migrations write to the **new** collection without deleting the old.
- Never `db.collection.drop()` from a migration. Manual cleanup only after the read-switch is proven.

## Running

```bash
cd server
# dry run — see counts only
node scripts/migrations/20260530-bag-to-unit.js --dry-run
# real run, default batch size 500
node scripts/migrations/20260530-bag-to-unit.js
# custom batch size, resume from a specific bag _id
node scripts/migrations/20260530-bag-to-unit.js --batch 1000 --from 67abc...
```

Requires `MONGODB_URI` in the env (read via `dotenv` from `server/.env`).

## Available migrations

| Date       | Script                                        | Purpose                                                                     |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| 2026-05-30 | `20260530-bag-to-unit.js`                      | Split each `BloodBag` into one `Donation` + N `BloodUnit` + one `TtiResult` |
| 2026-07-13 | `20260713-standardize-component-types.js`      | Collapse legacy component-type vocabulary down to the canonical codes       |
| 2026-07-14 | `20260714-retire-sdp-component.js`              | Soft-delete existing SDP `BloodUnit`/`PLATELETPHERESIS` `Donation` docs after those values were retired from the app |

## Adding a new one

Use the skill `/add-mongoose-migration` or copy the template at the top of `20260530-bag-to-unit.js`.
