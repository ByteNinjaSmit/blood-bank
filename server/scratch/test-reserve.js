const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://smitrajbankar:Amruta%401969%23Smitraj@212.85.24.35:27017/?authSource=admin";
const dbName = "BloodBank";

async function test() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { dbName });
  console.log("Connected.");

  // Register Schemas dynamically
  const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));
  const Requisition = mongoose.model('Requisition', new mongoose.Schema({}, { strict: false }));
  const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));

  const body = {
    hospitalId: "6a295a50b5de3cc8058514f9",
    reservedUntil: new Date("2026-06-16"),
    patient: {
      name: "ghj ghjk",
      age: 54,
      sex: "M"
    },
    items: [
      {
        componentType: "RBC",
        units: 1,
        bloodGroup: "B",
        rh: "Positive"
      }
    ]
  };

  const actorObjId = new mongoose.Types.ObjectId("6a295a50b5de3cc8058514f9"); // Dummy user ID

  try {
    console.log("Step 1: Creating patient...");
    const patientPublicId = `PA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - body.patient.age);

    const patient = await Patient.create({
      patientPublicId,
      name: body.patient.name,
      dob,
      sex: body.patient.sex,
      createdBy: actorObjId,
      updatedBy: actorObjId,
    });
    console.log("Patient created:", patient._id);

    console.log("Step 2: Mapping requested components...");
    const requestedComponents = body.items.map((it) => {
      let compType = it.componentType;
      if (compType === 'RBC') compType = 'PRBC';
      else if (compType === 'Platelet') compType = 'PLATELET_CONCENTRATE';
      else if (compType === 'Cryo') compType = 'CRYOPRECIPITATE';

      let rh = it.rh;
      if (rh === 'Positive') rh = 'POSITIVE';
      else if (rh === 'Negative') rh = 'NEGATIVE';

      return {
        componentType: compType,
        units: it.units,
        aboGroup: it.bloodGroup,
        rhFactor: rh,
        urgency: 'ROUTINE',
      };
    });
    console.log("Mapped requested components:", requestedComponents);

    console.log("Step 3: Creating requisition...");
    const dateStamp = () => {
      const d = new Date();
      return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    };
    const rand = () => new mongoose.Types.ObjectId().toHexString().slice(-6).toUpperCase();

    const requisitionId = `RQ-${dateStamp()}-${rand()}`;
    const requisition = await Requisition.create({
      requisitionId,
      hospitalId: new mongoose.Types.ObjectId(body.hospitalId),
      patientId: patient._id,
      clinicianName: 'Reserve Wizard',
      requiredAt: body.reservedUntil,
      requestedComponents,
      status: 'PENDING',
      createdBy: actorObjId,
      updatedBy: actorObjId,
    });
    console.log("Requisition created:", requisition._id);

    console.log("Step 4: Checking shortages...");
    const rc = requestedComponents[0];
    
    const aboGroups = rc.aboGroup === 'B' ? ['B', 'O'] : [rc.aboGroup]; 
    console.log("aboGroups compatibility list:", aboGroups);

    const candidates = await BloodUnit.find({
      componentType: rc.componentType,
      status: 'RELEASED',
      aboGroup: { $in: aboGroups },
      deletedAt: null,
    }).sort({ expiresAt: 1 }).lean();

    console.log("Found", candidates.length, "candidates in stock.");
    if (candidates.length > 0) {
      console.log("First candidate details:", candidates[0].unitId, candidates[0].aboGroup, candidates[0].rhFactor, candidates[0].status);
    }

    // Now let's try calling selectUnits by importing it dynamically from compiled dist/
    const { selectUnits } = require('../dist/shared/compatibility/fefo.js');
    const formattedCandidates = candidates.map(c => ({
      unitId: c.unitId,
      componentType: c.componentType,
      aboGroup: c.aboGroup,
      rhFactor: c.rhFactor,
      expiresAt: c.expiresAt,
      specialAttributes: new Set(c.specialAttributes || []),
      status: c.status,
    }));

    const selection = selectUnits(formattedCandidates, {
      recipient: { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
      component: rc.componentType,
      specialNeeds: [],
      unitsRequired: rc.units,
    });

    console.log("Selection result:", selection);

  } catch (err) {
    console.error("ERROR DURING RESERVATION LOGIC EXECUTION:");
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
