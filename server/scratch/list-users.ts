import 'dotenv/config';
import { connectDb, disconnectDb } from '../src/core/db';
import { UserModel } from '../src/modules/user/user.model';

async function main() {
  await connectDb();
  console.log('Connected to DB. Listing users...');
  const users = await UserModel.find({}, { name: 1, email: 1, role: 1, status: 1 }).lean();
  console.log(JSON.stringify(users, null, 2));
  await disconnectDb();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
