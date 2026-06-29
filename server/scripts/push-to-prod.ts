/* eslint-disable no-console */
// FULL REPLACE: copy local BloodBank → remote (production), crash-safe.
//
// Strategy (safe against a flaky link):
//   1. Back up EVERY remote collection to backups/remote-<ts>/*.json (EJSON).
//   2. Copy each local collection into a STAGING collection `_stage_<name>`.
//   3. Only after ALL staging copies succeed, swap atomically per collection:
//        drop original  →  rename _stage_<name> → name.
//   If the link dies during step 2, originals are untouched; rerun is safe.
//
//   npx tsx scripts/push-to-prod.ts            (dry run: backup only)
//   npx tsx scripts/push-to-prod.ts --apply    (perform the replace)

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import type { Connection } from 'mongoose';

const EJSON = mongoose.mongo.BSON.EJSON;

const LOCAL = 'mongodb://127.0.0.1:27017';
const REMOTE = 'mongodb://smitrajbankar:Amruta%401969%23Smitraj@212.85.24.35:27017/?authSource=admin';
const DB = 'BloodBank';
const SKIP = new Set(['refreshtokens', 'authotps', 'loginotps', 'registrationotps']); // transient sessions
const APPLY = process.argv.includes('--apply');
const STAGE = '_stage_';

async function connectRetry(uri: string, label: string, tries = 6): Promise<Connection> {
  for (let i = 1; i <= tries; i++) {
    try {
      return await mongoose.createConnection(uri, { dbName: DB, serverSelectionTimeoutMS: 6000 }).asPromise();
    } catch (e) {
      console.log(`  ${label} connect attempt ${i}/${tries} failed: ${(e as Error).message.split('\n')[0]}`);
      if (i === tries) throw e;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const localConn = await connectRetry(LOCAL, 'local');
  const remoteConn = await connectRetry(REMOTE, 'remote');
  const ldb = localConn.db!;
  const rdb = remoteConn.db!;

  // ── 1. BACKUP remote ───────────────────────────────────────────────────
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `remote-${ts}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const remoteCols = (await rdb.listCollections().toArray()).filter((c) => !c.name.startsWith(STAGE));
  let backedUp = 0;
  for (const c of remoteCols) {
    const docs = await rdb.collection(c.name).find().toArray();
    fs.writeFileSync(path.join(backupDir, `${c.name}.json`), EJSON.stringify(docs, undefined, 2));
    backedUp += docs.length;
  }
  console.log(`BACKUP: ${remoteCols.length} collections, ${backedUp} docs → ${backupDir}`);

  if (!APPLY) {
    console.log('\nDRY RUN — no writes. Re-run with --apply to perform the full replace.');
    await localConn.close(); await remoteConn.close();
    return;
  }

  // ── 2. COPY local → remote STAGING ─────────────────────────────────────
  const localCols = (await ldb.listCollections().toArray()).filter((c) => !SKIP.has(c.name) && !c.name.startsWith(STAGE));
  const staged: string[] = [];
  let copied = 0;
  for (const c of localCols) {
    const docs = await ldb.collection(c.name).find().toArray();
    if (docs.length === 0) continue;
    const stageName = STAGE + c.name;
    await rdb.collection(stageName).drop().catch(() => undefined); // clear any prior partial
    await rdb.collection(stageName).insertMany(docs, { ordered: false });
    staged.push(c.name);
    copied += docs.length;
    console.log(`  staged ${c.name}: ${docs.length}`);
  }
  console.log(`STAGED: ${copied} docs across ${staged.length} collections`);

  // ── 3. SWAP (fast): drop original, rename staging → original ────────────
  for (const name of staged) {
    await rdb.collection(name).drop().catch(() => undefined);
    await rdb.renameCollection(STAGE + name, name, { dropTarget: true });
  }
  // Drop any leftover remote collections that local fully replaced set doesn't include?
  // (We keep extra remote-only collections out — full replace means remove them.)
  for (const c of remoteCols) {
    if (!staged.includes(c.name)) {
      await rdb.collection(c.name).drop().catch(() => undefined);
    }
  }
  console.log(`SWAPPED: ${staged.length} collections live`);

  // ── verify ─────────────────────────────────────────────────────────────
  console.log('\n=== REMOTE NOW ===');
  const after = (await rdb.listCollections().toArray()).filter((c) => !c.name.startsWith(STAGE));
  for (const c of after.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${c.name}: ${await rdb.collection(c.name).countDocuments()}`);
  }
  await localConn.close(); await remoteConn.close();
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
