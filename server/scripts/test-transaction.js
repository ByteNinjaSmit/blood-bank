const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://smitrajbankar:Amruta%401969%23Smitraj@212.85.24.35:27017/?authSource=admin';

async function main() {
  await mongoose.connect(MONGODB_URI, {
    dbName: 'BloodBank'
  });
  console.log('Connected to DB');

  try {
    const session = await mongoose.startSession();
    console.log('Session started');
    await session.withTransaction(async () => {
      console.log('Inside transaction');
    });
    console.log('Transaction succeeded');
    await session.endSession();
  } catch (err) {
    console.error('Transaction failed:', err.message);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
