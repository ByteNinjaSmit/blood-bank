import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' });
  console.log('Connected to DB.');
  const db = mongoose.connection.db!;

  const rejectedStocks = await db.collection('bagstocks').find({ status: 'REJECTED' }).toArray();
  console.log('--- REJECTED STOCKS ---', rejectedStocks);

  const rejectedInspections = await db
    .collection('baginspections')
    .find({ decision: 'REJECTED' })
    .toArray();
  console.log('--- REJECTED INSPECTIONS ---', rejectedInspections);

  await mongoose.disconnect();
}

main().catch(console.error);
