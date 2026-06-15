import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../src/core/db';
import { UserModel } from '../src/modules/user/user.model';

async function main() {
  await connectDb();
  const email = 'smitrajbankar11@gmail.com';
  const plainPassword = 'Admin@123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  
  const res = await UserModel.updateOne(
    { email: email.toLowerCase() },
    { $set: { password: passwordHash } }
  );
  
  console.log(`Password reset response:`, res);
  await disconnectDb();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
