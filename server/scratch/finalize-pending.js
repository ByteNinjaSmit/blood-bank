const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-bank';

mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Dynamically retrieve collections
    const TtiResult = mongoose.connection.collection('ttiresults');
    const BloodUnit = mongoose.connection.collection('bloodunits');
    const User = mongoose.connection.collection('users');

    const releasedTtis = await TtiResult.find({ 
      releaseDecision: 'released'
    }).toArray();

    console.log(`Found ${releasedTtis.length} released TTI results. Checking corresponding units...`);

    const sysAdmin = await User.findOne({});
    const actorId = sysAdmin ? sysAdmin._id : new mongoose.Types.ObjectId();

    for (const tti of releasedTtis) {
      const stuckUnits = await BloodUnit.find({
        donationId: tti.donationId,
        status: { $in: ['COLLECTED', 'IN_TESTING', 'QUARANTINE'] },
        deletedAt: null
      }).toArray();

      if (stuckUnits.length === 0) continue;

      console.log(`Finalizing ${stuckUnits.length} stuck units for donation: ${tti.donationId}`);

      // Update corresponding units to RELEASED
      const updateResult = await BloodUnit.updateMany(
        { donationId: tti.donationId, status: { $in: ['COLLECTED', 'QUARANTINE', 'IN_TESTING'] }, deletedAt: null },
        {
          $set: {
            status: 'RELEASED',
            updatedBy: actorId
          },
          $push: {
            statusHistory: {
              from: 'QUARANTINE',
              to: 'RELEASED',
              event: 'RELEASE',
              actor: actorId,
              at: new Date(),
              reason: 'Automatic recovery check for transaction crash'
            }
          }
        }
      );

      console.log(`Updated ${updateResult.modifiedCount} units to RELEASED for donation ${tti.donationId}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
