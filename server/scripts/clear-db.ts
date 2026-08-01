import path from 'node:path';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sanjivani.org';
const REPORTS_DIR = process.env.REPORTS_DIR || './reports';

async function main() {
  console.log('Starting system data clearance and master seeding...');

  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in the environment.');
    process.exit(1);
  }

  // 1. Connect to MongoDB
  console.log(`Connecting to MongoDB at: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' });
  console.log('Connected to MongoDB.');

  // 2. Drop the MongoDB Database
  console.log('Dropping database "BloodBank"...');
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    console.log('Database "BloodBank" dropped successfully.');
  } else {
    console.warn('MongoDB connection db instance not found. Skipping drop.');
  }

  // 3. Re-create collections and seed default administrator
  console.log('Re-creating collections and seeding system admin user...');
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

  // Hash password "Admin@123"
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await UserModel.create({
    publicId: 'USR-2026-0001',
    name: { first: 'System', last: 'Admin' },
    email: ADMIN_EMAIL.toLowerCase(),
    phone: '9999999999',
    role: 'system-admin',
    password: passwordHash,
    status: 'active',
    permissions: [],
  });

  console.log(`Default administrator created:`);
  console.log(`- Email: ${adminUser.email}`);
  console.log(`- Password: Admin@123`);
  console.log(`- Role: system-admin`);

  // 4. Seed Chemical Categories
  console.log('Seeding initial chemical categories...');
  const CategorySchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      description: { type: String },
      deletedAt: { type: Date, default: null },
      createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    { timestamps: true },
  );
  const CategoryModel =
    mongoose.models.ChemicalCategory || mongoose.model('ChemicalCategory', CategorySchema);

  const defaultCats = [
    { name: 'Blood Grouping Reagents', description: 'Anti-A, Anti-B, Anti-D, AHG etc.' },
    { name: 'ELISA / Microlisa Kits', description: 'HIV, HBsAg, HCV, Syphilis testing kits' },
    { name: 'Immunohematology', description: 'Gel cards, Monocells, Coombs control cells' },
  ];
  for (const cat of defaultCats) {
    await CategoryModel.create({
      ...cat,
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });
  }
  console.log('Chemical categories seeded successfully.');

  // 5. Seed Chemical Manufacturers
  console.log('Seeding initial chemical manufacturers...');
  const ManufacturerSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      deletedAt: { type: Date, default: null },
      createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    { timestamps: true },
  );
  const ManufacturerModel =
    mongoose.models.ChemicalManufacturer ||
    mongoose.model('ChemicalManufacturer', ManufacturerSchema);

  const defaultMfgs = [
    { name: 'Tulip Diagnostics' },
    { name: 'J. Mitra' },
    { name: 'Bio-Rad' },
    { name: 'Cluett' },
  ];
  for (const mfg of defaultMfgs) {
    await ManufacturerModel.create({
      ...mfg,
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });
  }
  console.log('Chemical manufacturers seeded successfully.');

  // Close MongoDB
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');

  // 6. Connect to Redis and flush cache
  console.log(`Connecting to Redis at: ${REDIS_URL}`);
  try {
    const redis = new Redis(REDIS_URL);
    await new Promise<void>((resolve, reject) => {
      redis.on('connect', () => resolve());
      redis.on('error', (err) => reject(err));
    });
    console.log('Connected to Redis. Flushing cache keys...');
    await redis.flushall();
    console.log('Redis cache cleared successfully.');
    await redis.quit();
  } catch (err) {
    console.warn(`Warning: Could not clear Redis cache. Reason: ${(err as Error).message}`);
  }

  // 7. Delete generated PDF reports
  const reportsPath = path.resolve(__dirname, '..', REPORTS_DIR);
  console.log(`Clearing reports folder at: ${reportsPath}`);
  try {
    const files = await fs.readdir(reportsPath);
    let deletedCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        const filePath = path.join(reportsPath, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }
    console.log(`Deleted ${deletedCount} report files.`);
  } catch (err) {
    console.warn(`Warning: Could not clear reports folder. Reason: ${(err as Error).message}`);
  }

  console.log('\n--- System reset and master seeding complete! ---');
}

main().catch((err) => {
  console.error('Fatal error during system reset:', err);
  process.exit(1);
});
