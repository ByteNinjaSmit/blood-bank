/* eslint-disable no-console */
// Grant an account the full permission grid (all modules, all CRUD flags).
// Effective authz for system-admin is already "all" via role defaults
// (role-map.ts), but this also fills the stored user.permissions grid.
//   npx tsx scripts/grant-all-perms.ts [email]

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { UserModel } from '@/modules/user/user.model';
import { PERMISSION } from '@/shared/enums';

const EMAIL = (process.argv[2] ?? 'smitrajbankar11@gmail.com').toLowerCase();

// Derive every module name from the canonical PERMISSION list (prefix before ':').
const modules = Array.from(new Set(PERMISSION.map((p) => p.split(':')[0])));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: 'BloodBank',
    serverSelectionTimeoutMS: 8000,
  });

  const permissions = modules.map((moduleName) => ({
    moduleName,
    view: true,
    create: true,
    update: true,
    delete: true,
  }));

  const res = await UserModel.updateOne(
    { email: EMAIL },
    { $set: { permissions, role: 'system-admin', status: 'active' } },
  );

  if (res.matchedCount === 0) {
    console.error(`No user with email ${EMAIL}`);
    process.exit(1);
  }
  console.log(`Granted full grid (${modules.length} modules) to ${EMAIL}`);
  console.log('modules:', modules.join(', '));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
