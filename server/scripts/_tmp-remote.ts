import mongoose from 'mongoose';
const REMOTE =
  'mongodb://smitrajbankar:Amruta%401969%23Smitraj@212.85.24.35:27017/?authSource=admin';
(async () => {
  await mongoose.connect(REMOTE, { dbName: 'BloodBank', serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db!;
  const cols = await db.listCollections().toArray();
  console.log('REMOTE BloodBank collections:', cols.length);
  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${c.name}: ${await db.collection(c.name).countDocuments()}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
