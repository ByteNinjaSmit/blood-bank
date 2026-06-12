const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-bank';

mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const BloodUnit = mongoose.connection.collection('bloodunits');
    const Donation = mongoose.connection.collection('donations');
    const TtiResult = mongoose.connection.collection('ttiresults');

    const donations = await Donation.find({}).toArray();
    console.log(`=== Donations Count: ${donations.length} ===`);
    donations.forEach(d => {
      console.log(`Donation: ${d.donationId}, Type: ${d.donationType}, Bag: ${d.typeOfBag}`);
    });

    const units = await BloodUnit.find({}).toArray();
    console.log(`=== Blood Units Count: ${units.length} ===`);
    units.forEach(u => {
      console.log(`Unit: ${u.unitId}, Component: ${u.componentType}, Status: ${u.status}, Deleted: ${!!u.deletedAt}`);
    });

    const ttis = await TtiResult.find({}).toArray();
    console.log(`=== TTI Results Count: ${ttis.length} ===`);
    ttis.forEach(t => {
      console.log(`TTI: ${t.donationId}, Decision: ${t.releaseDecision}, Tests Count: ${t.tests?.length || 0}`);
    });

    await mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
