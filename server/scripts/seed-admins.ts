import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/seed-admins.ts <email> <password> [firstName] [lastName]');
    process.exit(1);
  }

  const email = args[0].toLowerCase();
  const password = args[1];
  const firstName = args[2] || 'Admin';
  const lastName = args[3] || 'User';

  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in the environment.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' });

  const UserSchema = new mongoose.Schema(
    {
      publicId: { type: String, required: true, unique: true },
      name: {
        first: { type: String, required: true },
        last: { type: String, required: true },
      },
      email: { type: String, required: true, unique: true, lowercase: true },
      phone: { type: String },
      role: { type: String, required: true },
      password: { type: String, required: true },
      status: { type: String, default: 'active' },
      permissions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    { timestamps: true },
  );

  const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

  // Generate public ID
  const count = await UserModel.countDocuments({});
  const seq = String(count + 1).padStart(4, '0');
  const year = new Date().getFullYear();
  const publicId = `USR-${year}-${seq}`;

  // Check if exists
  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log(
      `User with email ${email} already exists! Status: ${existing.status}. Updating password and role to system-admin...`,
    );
    existing.password = await bcrypt.hash(password, 10);
    existing.role = 'system-admin';
    existing.status = 'active';
    await existing.save();
    console.log(`User ${email} has been updated successfully.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await UserModel.create({
      publicId,
      name: { first: firstName, last: lastName },
      email,
      role: 'system-admin',
      password: passwordHash,
      status: 'active',
      permissions: [],
    });
    console.log(`Successfully created system-admin account:`);
    console.log(`- Email: ${email}`);
    console.log(`- Name: ${firstName} ${lastName}`);
    console.log(`- Public ID: ${publicId}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
