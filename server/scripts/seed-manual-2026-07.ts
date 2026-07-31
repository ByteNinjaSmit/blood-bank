/* eslint-disable no-console */
// One-off additive seed for the 2026-07-06 data request:
//   - chemical master (27 named reagents/kits, suppliers, manufacturers, 20-qty stock each)
//   - blood bag procurement (vendor -> PO -> GRN -> bag stock -> bag inspection/batch testing,
//     5 boxes DOUBLE + 5 boxes TRIPLE, 50 bags/box)
//   - 100 donors (350ml donations; DOUBLE bag -> PRBC+FFP, TRIPLE bag -> PRBC+FFP+PLATELET,
//     no whole-blood units kept); serology done for 80, 20 donations left untested
//   - 8 extra temporary-deferred + 8 extra permanent-deferred donors (no donation)
//   - 5 hospitals
//   - 20 requisitions (mixed single/multi component); 10 issued+completed, 10 approved+completed
//     without issuing
//   - 3 camps x 30 donors (25 donate + separate + serology, 5 deferred)
//   - 8 inventory reservations (mixed single/multi component)
//
// Does NOT clear any existing collection — purely additive. Safe to re-run
// (upserts by unique name/email where the schema allows it; otherwise
// continues existing ID sequences so nothing collides).
//
//   npx tsx scripts/seed-manual-2026-07.ts

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { UserModel } from '@/modules/user/user.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { VendorModel } from '@/modules/vendor/vendor.model';
import { CampModel } from '@/modules/camp/camp.model';
import { CampDonationModel } from '@/modules/camp/camp-donation.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { PatientModel } from '@/modules/patient/patient.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { CrossmatchModel } from '@/modules/crossmatch/crossmatch.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { PurchaseOrderModel } from '@/modules/purchase-order/purchase-order.model';
import { GoodsReceiptModel } from '@/modules/goods-receipt/goods-receipt.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import {
  ChemicalCategoryModel,
  ChemicalManufacturerModel,
  ChemicalSupplierModel,
  ChemicalModel,
  ChemicalPurchaseModel,
  ChemicalStockLotModel,
  ChemicalStockHistoryModel,
} from '@/modules/chemical-inventory/chemical-inventory.model';

const PASSWORD = 'Password@123';

// ── deterministic RNG (LCG) ──────────────────────────────────────────────────
let _seed = 987654321;
const rnd = () => ((_seed = (_seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const randInt = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const choice = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

const days = (n: number) => n * 24 * 60 * 60 * 1000;
const ago = (n: number) => new Date(Date.now() - days(n));
const ahead = (n: number) => new Date(Date.now() + days(n));
const pad = (n: number, w = 4) => String(n).padStart(w, '0');

const MALE = ['Rahul', 'Vikram', 'Amit', 'Deepak', 'Manoj', 'Suresh', 'Rohit', 'Nikhil', 'Arjun', 'Kiran', 'Sachin', 'Ganesh', 'Prashant', 'Yogesh', 'Akash', 'Vivek', 'Sandeep', 'Mahesh', 'Ravi', 'Ajay'];
const FEMALE = ['Anjali', 'Pooja', 'Sunita', 'Kavya', 'Reena', 'Priya', 'Sneha', 'Manisha', 'Aarti', 'Neha', 'Swati', 'Divya', 'Komal', 'Shraddha', 'Madhuri', 'Rupali', 'Snehal', 'Vaishali', 'Trupti', 'Pallavi'];
const LAST = ['Sharma', 'Patil', 'Singh', 'Joshi', 'Kumar', 'Rao', 'Verma', 'Nair', 'Pawar', 'Shah', 'Deshmukh', 'Kulkarni', 'Gupta', 'Iyer', 'Jadhav', 'More', 'Shinde', 'Bhosale', 'Chavan', 'Gaikwad'];
const CITIES: Array<[string, string, string]> = [
  ['Ahmednagar', 'Ahmednagar', '414001'], ['Pune', 'Pune', '411001'], ['Nashik', 'Nashik', '422001'],
  ['Aurangabad', 'Aurangabad', '431001'], ['Mumbai', 'Mumbai', '400001'], ['Solapur', 'Solapur', '413001'],
];
const OCCUPATIONS = ['Teacher', 'Engineer', 'Farmer', 'Clerk', 'Student', 'Businessman', 'Nurse', 'Driver', 'Shopkeeper'];

type ABO = 'O' | 'A' | 'B' | 'AB';
type RH = 'POSITIVE' | 'NEGATIVE';
const ABO_WEIGHTED: ABO[] = [...Array(37).fill('O'), ...Array(28).fill('B'), ...Array(24).fill('A'), ...Array(11).fill('AB')] as ABO[];
const rhPick = (): RH => (chance(0.92) ? 'POSITIVE' : 'NEGATIVE');
const aboPick = (): ABO => choice(ABO_WEIGHTED);

async function nextSeq(Model: mongoose.Model<any>, field: string, prefix: string): Promise<number> {
  const esc = prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp('^' + esc + '(\\d+)');
  const docs = await Model.find({ [field]: re }, { [field]: 1 }).lean();
  let max = 0;
  for (const d of docs as any[]) {
    const m = String(d[field] ?? '').match(re);
    if (m) max = Math.max(max, parseInt(m[1] ?? '0', 10));
  }
  return max + 1;
}

async function getOrCreateStaff(email: string, role: string, first: string, last: string, admin?: mongoose.Types.ObjectId) {
  let u = await UserModel.findOne({ email: email.toLowerCase() });
  if (u) return u;
  const seq = await nextSeq(UserModel, 'publicId', 'USR-2026-');
  u = await UserModel.create({
    publicId: `USR-2026-${pad(seq)}`,
    name: { first, last },
    email, phone: `+9198${pad(randInt(10000000, 99999999), 8)}`,
    role, password: PASSWORD, status: 'active', permissions: [],
    createdBy: admin, updatedBy: admin,
  });
  return u;
}

async function main() {
  const uri = process.env.MONGODB_URI!;
  console.log('connecting', uri.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(uri, { dbName: 'BloodBank', serverSelectionTimeoutMS: 8000 });
  console.log('connected (additive run — no collections cleared)');

  // ── 0. STAFF (reuse existing seed's accounts if present) ─────────────────
  const admin = (await UserModel.findOne({ role: 'system-admin' })) ?? (await getOrCreateStaff('smitrajbankar11@gmail.com', 'system-admin', 'Smitraj', 'Bankar'));
  const bbo = await getOrCreateStaff('bbo@sanjivani.test', 'bbo', 'Bhushan', 'Officer', admin._id);
  const mo = await getOrCreateStaff('mo@sanjivani.test', 'medical-officer', 'Meera', 'Doctor', admin._id);
  const phlebo = await getOrCreateStaff('phlebo@sanjivani.test', 'phlebotomist', 'Priya', 'Phlebo', admin._id);
  const labComp = await getOrCreateStaff('labcomp@sanjivani.test', 'lab-tech-component', 'Lalit', 'Component', admin._id);
  const labSero = await getOrCreateStaff('labsero@sanjivani.test', 'lab-tech-serology', 'Sneha', 'Serology', admin._id);
  const store = await getOrCreateStaff('store@sanjivani.test', 'store-keeper', 'Sanjay', 'Store', admin._id);
  const issueCounter = await getOrCreateStaff('issue@sanjivani.test', 'issue-counter', 'Ishan', 'Counter', admin._id);
  const qa = await getOrCreateStaff('qa@sanjivani.test', 'qa-manager', 'Qadir', 'Quality', admin._id);
  const campOrg = await getOrCreateStaff('camp@sanjivani.test', 'camp-organiser', 'Karan', 'Camp', admin._id);
  const hospUser = await getOrCreateStaff('hospital@sanjivani.test', 'hospital-user', 'Hema', 'Hospital', admin._id);
  const audit = { createdBy: admin._id, updatedBy: admin._id };
  console.log('staff resolved');

  // ── 1. CHEMICAL MASTER (27 items from the supplied table) ───────────────
  const CHEM_ROWS: Array<[string, string, string, string]> = [
    // name, supplier, manufacturer, unitType
    ['Anti-A', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti-B', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti-AB', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti-D (Rh)', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti-H (Lectin)', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti-A1 Lectin', 'Universal Chemicals', 'Tulip Diagnostics', 'Bottle'],
    ['Albumin', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti Human Globulin (AHG)', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Gel Cards', 'Bio-Rad', 'Bio-Rad', 'Card'],
    ['Control Cells', 'Bio-Rad', 'Bio-Rad', 'Pack'],
    ['Monocell I', 'Cluett', 'Cluett', 'Pack'],
    ['Monocell II', 'Cluett', 'Cluett', 'Pack'],
    ['Monocell III', 'Cluett', 'Cluett', 'Pack'],
    ['HCV Microlisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['HIV Microlisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['HBsAg Microlisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['Syphilis Microlisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['Malaria Microlisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['Hepalisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['HIV Elisa Ag', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['HCV Elisa Ag', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['HBsAg Elisa', 'Universal Chemicals', 'J. Mitra', 'Kit'],
    ['Blood Bag (Double Bag)', 'OM Surgical & Pharma', 'OM Surgical & Pharma', 'Bag'],
    ['Blood Bag (Triple Bag)', 'OM Surgical & Pharma', 'OM Surgical & Pharma', 'Bag'],
    ['H. Pylori Kit', 'Tulip', 'Tulip Diagnostics', 'Kit'],
    ['Dexazyme / Anti-ADD Reagent', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
    ['Anti-D (Lectin/Reagent variant)', 'Tulip', 'Tulip Diagnostics', 'Bottle'],
  ];

  const category = await ChemicalCategoryModel.findOneAndUpdate(
    { name: 'Lab Reagents & Kits' },
    { $setOnInsert: { name: 'Lab Reagents & Kits', description: 'Blood grouping, crossmatch, TTI reagents/kits and bag supplies', ...audit } },
    { upsert: true, new: true },
  );

  const supplierNames = [...new Set(CHEM_ROWS.map((r) => r[1]))];
  const manufacturerNames = [...new Set(CHEM_ROWS.map((r) => r[2]))];
  const suppliers = new Map<string, mongoose.Types.ObjectId>();
  for (const name of supplierNames) {
    const doc = await ChemicalSupplierModel.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, contactPerson: choice(LAST), phone: `+91-22-4000${pad(randInt(1000, 9999), 4)}`, email: `sales@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.test`, gstNumber: `27AABCD${pad(randInt(1000, 9999), 4)}Z${randInt(1, 9)}`, address: `${choice(CITIES)[0]}, MH`, ...audit } },
      { upsert: true, new: true },
    );
    suppliers.set(name, doc._id as mongoose.Types.ObjectId);
  }
  const manufacturers = new Map<string, mongoose.Types.ObjectId>();
  for (const name of manufacturerNames) {
    const doc = await ChemicalManufacturerModel.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, ...audit } },
      { upsert: true, new: true },
    );
    manufacturers.set(name, doc._id as mongoose.Types.ObjectId);
  }

  const chemicals: InstanceType<typeof ChemicalModel>[] = [];
  for (const [name, supplierName, mfrName, unitType] of CHEM_ROWS) {
    const doc = await ChemicalModel.findOneAndUpdate(
      { name },
      {
        $setOnInsert: {
          name, categoryId: category._id, manufacturerId: manufacturers.get(mfrName),
          unitType, minStockLevel: 5, reorderLevel: 10, isActive: true, ...audit,
        },
      },
      { upsert: true, new: true },
    );
    chemicals.push(doc);
  }
  console.log('chemicals upserted:', chemicals.length, '| suppliers:', suppliers.size, '| manufacturers:', manufacturers.size);

  // One purchase invoice per supplier grouping; every chemical from that
  // supplier gets its own 20-qty stock lot against that invoice.
  let cinvSeq = await nextSeq(ChemicalPurchaseModel, 'invoiceNumber', 'CINV-2026-');
  const chemStockQty = 20;
  for (const supplierName of supplierNames) {
    const supplierId = suppliers.get(supplierName)!;
    const rowsForSupplier = CHEM_ROWS.filter((r) => r[1] === supplierName);
    const perUnitCost = randInt(400, 2500);
    const totalAmount = perUnitCost * chemStockQty * rowsForSupplier.length;
    const purchase = await ChemicalPurchaseModel.create({
      invoiceNumber: `CINV-2026-${pad(cinvSeq++)}`,
      purchaseDate: ago(randInt(5, 30)),
      supplierId,
      totalAmount,
      paidAmount: totalAmount,
      paymentStatus: 'Fully Paid',
      remarks: `Chemical master stocking — ${supplierName}`,
      ...audit,
    });
    for (const [name, , mfrName] of rowsForSupplier) {
      const chem = chemicals.find((c) => c.name === name)!;
      const mfrId = manufacturers.get(mfrName)!;
      const cost = randInt(400, 2500);
      const lot = await ChemicalStockLotModel.create({
        chemicalId: chem._id, purchaseId: purchase._id, purchaseDate: purchase.purchaseDate,
        invoiceNumber: purchase.invoiceNumber, supplierId, manufacturerId: mfrId,
        lotNumber: `LOT-${randInt(1000, 9999)}`, batchNumber: `B-${randInt(100, 999)}`,
        mfgDate: ago(randInt(30, 90)), expiryDate: ahead(randInt(180, 500)),
        qtyPurchased: chemStockQty, qtyAvailable: chemStockQty, qtyInUse: 0, qtyConsumed: 0,
        costPerUnit: cost, totalCost: cost * chemStockQty,
        cgstPercent: 9, sgstPercent: 9, cgstAmount: Math.round(cost * chemStockQty * 0.09), sgstAmount: Math.round(cost * chemStockQty * 0.09),
        totalAmount: Math.round(cost * chemStockQty * 1.18),
        remarks: 'Initial stock — 20 units', ...audit,
      });
      await ChemicalStockHistoryModel.create({
        chemicalId: chem._id, lotId: lot._id, action: 'PURCHASE', quantity: chemStockQty,
        remarks: `Received ${chemStockQty} units against ${purchase.invoiceNumber}`, createdBy: admin._id,
      });
    }
  }
  console.log('chemical purchases + 20-qty stock lots created for all 27 chemicals');

  // ── 2. BLOOD BAG PROCUREMENT (5 boxes DOUBLE + 5 boxes TRIPLE) ───────────
  const BOX_SIZE = 50; // bags per box
  let vendor = await VendorModel.findOne({ name: 'OM Surgical & Pharma' });
  if (!vendor) {
    const vSeq = await nextSeq(VendorModel, 'vendorId', 'VEN-');
    vendor = await VendorModel.create({
      vendorId: `VEN-${pad(vSeq)}`, name: 'OM Surgical & Pharma', manufacturer: 'OM Surgical & Pharma',
      drugLicenseNo: `DL-MH-2026-${1000 + vSeq}`, gstNo: `27AABCO${pad(vSeq, 4)}A1Z${vSeq % 10}`,
      address: `Ahmednagar, MH`, contactPerson: choice(LAST), contactPhone: `+91-241-2299${pad(vSeq, 2)}`,
      email: 'sales@omsurgical.test', approvalStatus: 'APPROVED', contractStart: ago(300), contractEnd: ahead(400),
      ...audit,
    });
  }

  const poSeq = await nextSeq(PurchaseOrderModel, 'poNumber', 'PO-2026-');
  const po = await PurchaseOrderModel.create({
    poNumber: `PO-2026-${pad(poSeq)}`, poDate: ago(20), vendorId: vendor._id,
    lineItems: [
      { bagType: 'DOUBLE', capacityMl: 350, anticoagulant: 'CPDA_1', productCode: 'PC-DBL-350', quantityOrdered: 5 * BOX_SIZE },
      { bagType: 'TRIPLE', capacityMl: 350, anticoagulant: 'CPDA_1', productCode: 'PC-TRP-350', quantityOrdered: 5 * BOX_SIZE },
    ],
    expectedDelivery: ago(12), manufacturer: vendor.manufacturer, billDate: ago(12),
    notes: 'Blood bag procurement — 5 boxes double + 5 boxes triple', ...audit,
  });

  const grnSeq = await nextSeq(GoodsReceiptModel, 'grnNumber', 'GRN-2026-');
  const batchDouble = `BATCH-DBL-${Date.now().toString().slice(-6)}`;
  const batchTriple = `BATCH-TRP-${Date.now().toString().slice(-6)}`;
  const grn = await GoodsReceiptModel.create({
    grnNumber: `GRN-2026-${pad(grnSeq)}`, poId: po._id, vendorName: vendor.name, invoiceNo: `INV-${vendor.vendorId}-BB01`,
    billDate: ago(12), transportDetails: 'Cold chain courier', receivedDate: ago(10), receivedById: store._id,
    batchLines: [
      { bagType: 'DOUBLE', capacityMl: 350, anticoagulant: 'CPDA_1', batchNumber: batchDouble, manufacturingDate: ago(60), expiryDate: ahead(400), quantityReceived: 5 * BOX_SIZE },
      { bagType: 'TRIPLE', capacityMl: 350, anticoagulant: 'CPDA_1', batchNumber: batchTriple, manufacturingDate: ago(60), expiryDate: ahead(400), quantityReceived: 5 * BOX_SIZE },
    ],
    financials: { basicAmountRs: 125000, cgstRs: 11250, sgstRs: 11250, igstRs: 0, discountRs: 5000, netAmountRs: 142500 },
    status: 'ACCEPTED', notes: 'Accepted in full', ...audit,
  });

  const stkSeq = await nextSeq(BagStockModel, 'stockId', 'STK-2026-');
  const stockDouble = await BagStockModel.create({
    stockId: `STK-2026-${pad(stkSeq)}`, bagType: 'DOUBLE', capacityMl: 350, anticoagulant: 'CPDA_1',
    manufacturer: vendor.manufacturer, batchNumber: batchDouble, expiryDate: ahead(400), grnId: grn._id,
    openingStock: 0, receivedQty: 5 * BOX_SIZE, issuedQty: 0, damagedQty: 0, discardedQty: 0, unopenedBoxes: 5,
    status: 'AVAILABLE', lastUpdatedAt: ago(10), ...audit,
  });
  const stockTriple = await BagStockModel.create({
    stockId: `STK-2026-${pad(stkSeq + 1)}`, bagType: 'TRIPLE', capacityMl: 350, anticoagulant: 'CPDA_1',
    manufacturer: vendor.manufacturer, batchNumber: batchTriple, expiryDate: ahead(400), grnId: grn._id,
    openingStock: 0, receivedQty: 5 * BOX_SIZE, issuedQty: 0, damagedQty: 0, discardedQty: 0, unopenedBoxes: 5,
    status: 'AVAILABLE', lastUpdatedAt: ago(10), ...audit,
  });

  const inspSeq = await nextSeq(BagInspectionModel, 'inspectionId', 'INSP-2026-');
  const inspections: Array<[InstanceType<typeof BagStockModel>, string, string]> = [
    [stockDouble, batchDouble, 'DOUBLE'],
    [stockTriple, batchTriple, 'TRIPLE'],
  ];
  let inspSeqCursor = inspSeq;
  for (const [stock, batch] of inspections) {
    await BagInspectionModel.create({
      inspectionId: `INSP-2026-${pad(inspSeqCursor++)}`, grnId: grn._id, stockId: stock._id, batchNumber: batch,
      inspectionDate: ago(10), inspectedById: qa._id, sampleSize: 10,
      physicalChecks: { sealIntact: true, noLeakage: true, tubeIntegrity: true, needleCondition: true, labelPresence: true, sterilityCheck: true, packagingCondition: true },
      anticoagulantVolumeOk: true, tubePatency: true, observation: 'All sampled bags passed physical QC', decision: 'ACCEPTED',
      testingType: 'EMPTY', testingStatus: 'REPORT_RECEIVED', sentDate: ago(9), reportDate: ago(7),
      testingLab: 'Central QC Lab', testResult: 'Pass — sterility and integrity confirmed', ...audit,
    });
  }
  console.log('blood bag procurement: vendor + PO + GRN + 2 stock batches (5 boxes DOUBLE, 5 boxes TRIPLE) + batch testing done');

  // ── 3. DONORS — 100 regular + 16 extra deferred ──────────────────────────
  function makeDonor(seq: number) {
    const sex = chance(0.55) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    const ln = choice(LAST);
    const [city, district, pincode] = choice(CITIES);
    const age = randInt(18, 60);
    return {
      donorId: `DNR-2026-${pad(seq)}`,
      name: { firstName: fn, lastName: ln },
      uid: `UID${200000 + seq}`,
      dob: new Date(2026 - age, randInt(0, 11), randInt(1, 27)),
      sex, phone: `+9197${pad(randInt(10000000, 99999999), 8)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${seq}@donor.test`,
      address: { line1: `${randInt(1, 200)} ${choice(['Gandhi', 'Nehru', 'Shivaji', 'Tilak'])} Path`, city, district, state: 'Maharashtra', pincode },
      occupation: choice(OCCUPATIONS), weightKg: randInt(50, 95),
      bloodGroup: aboPick(), rh: rhPick(),
      createdBy: phlebo._id, updatedBy: phlebo._id,
    };
  }

  let donorSeq = await nextSeq(DonorModel, 'donorId', 'DNR-2026-');
  const regularDonors: InstanceType<typeof DonorModel>[] = [];
  for (let i = 0; i < 100; i++) {
    regularDonors.push(await DonorModel.create({ ...makeDonor(donorSeq++), eligibilityStatus: 'eligible' }));
  }
  console.log('regular donors:', regularDonors.length);

  const TEMP_REASONS = ['High haemoglobin', 'Low haemoglobin', 'Recent tattoo (< 6 months)', 'Recent vaccination', 'Low blood pressure at screening', 'Underweight at screening', 'Recent minor surgery', 'Travel to malaria-endemic zone'];
  const PERM_REASONS = ['Chronic Hepatitis B carrier', 'HIV reactive history', 'Uncontrolled chronic hypertension', 'Cardiac disease', 'History of cancer', 'History of IV drug use', 'Repeated TTI-reactive donor', 'Autoimmune disease'];

  const tempDeferredDonors: InstanceType<typeof DonorModel>[] = [];
  for (let i = 0; i < 8; i++) {
    tempDeferredDonors.push(await DonorModel.create({ ...makeDonor(donorSeq++), eligibilityStatus: 'temp-deferred' }));
  }
  const permDeferredDonors: InstanceType<typeof DonorModel>[] = [];
  for (let i = 0; i < 8; i++) {
    permDeferredDonors.push(await DonorModel.create({ ...makeDonor(donorSeq++), eligibilityStatus: 'deferred' }));
  }
  await DeferralModel.create(tempDeferredDonors.map((d, i) => ({
    donor: d._id, type: 'TEMPORARY', reason: TEMP_REASONS[i % TEMP_REASONS.length],
    untilDate: ahead(randInt(15, 90)), source: choice(['VITALS', 'QUESTIONNAIRE'] as const),
    decidedBy: mo._id, ...audit,
  })));
  await DeferralModel.create(permDeferredDonors.map((d, i) => ({
    donor: d._id, type: 'PERMANENT', reason: PERM_REASONS[i % PERM_REASONS.length],
    source: 'MANUAL', decidedBy: mo._id, ...audit,
  })));
  console.log('extra deferred donors: 8 temporary + 8 permanent (with reasons)');

  // ── 4. DONATIONS (100) — 50 DOUBLE-bag, 50 TRIPLE-bag, 350ml each ────────
  // First 40 of each type get full TTI + separation (80 total); last 10 of
  // each type (20 total) are left as donation-only records.
  let donationSeq = await nextSeq(DonationModel, 'donationId', 'DON-2026-');
  type BagKind = 'DB' | 'TB';
  const donationPlan: Array<{ donor: InstanceType<typeof DonorModel>; bag: BagKind; tested: boolean }> = [];
  for (let i = 0; i < 50; i++) donationPlan.push({ donor: regularDonors[i]!, bag: 'DB', tested: i < 40 });
  for (let i = 0; i < 50; i++) donationPlan.push({ donor: regularDonors[50 + i]!, bag: 'TB', tested: i < 40 });

  const donations: Array<{ doc: InstanceType<typeof DonationModel>; bag: BagKind; tested: boolean; donor: InstanceType<typeof DonorModel> }> = [];
  for (const plan of donationPlan) {
    const collectedAt = ago(randInt(1, 15));
    const doc = await DonationModel.create({
      donationId: `DON-2026-${pad(donationSeq++)}`,
      bagNo: `BAG${9000 + donationSeq}`, segmentNo: `SEG${donationSeq}`, lotNo: `LOT-M${donationSeq}`,
      donor: plan.donor._id, donationType: 'WHOLE_BLOOD', collectedAt,
      phlebotomistId: phlebo._id,
      medicalExam: {
        weightKg: plan.donor.weightKg, hbGdl: 12.5 + rnd() * 4, temperatureCelsius: 36.5 + rnd(),
        pulseBpm: randInt(65, 90), bloodPressure: { systolic: randInt(110, 130), diastolic: randInt(70, 88) },
        oxygenSaturationPercent: randInt(96, 100), skinClearAtPhlebotomy: true, armsFreeOfPunctureScars: true, volumeMl: 350,
      },
      donorFitness: { isFit: true }, typeOfBag: plan.bag,
      createdBy: phlebo._id, updatedBy: phlebo._id,
    });
    donations.push({ doc, bag: plan.bag, tested: plan.tested, donor: plan.donor });
  }
  console.log('donations:', donations.length, '(', donations.filter((d) => d.tested).length, 'tested,', donations.filter((d) => !d.tested).length, 'left as-is )');

  // ── 5. TTI (80 tested) + component separation (no whole-blood units) ────
  const TTI_TESTS = ['HIV', 'HBSAG', 'HCV', 'SYPHILIS', 'MALARIA'] as const;
  let unitSeq = await nextSeq(BloodUnitModel, 'unitId', 'UNIT-2026-');
  const newReleasedUnits: InstanceType<typeof BloodUnitModel>[] = [];

  for (const d of donations.filter((x) => x.tested)) {
    await TtiResultModel.create({
      donationId: d.doc.donationId,
      aboGroupConfirmed: d.donor.bloodGroup, rhFactorConfirmed: d.donor.rh,
      tests: TTI_TESTS.map((t) => ({
        testName: t, method: choice(['ELISA', 'CLIA'] as const), result: 'NEGATIVE',
        technicianId: labSero._id, performedAt: new Date((d.doc.collectedAt as Date).getTime() + days(1)), kitLot: `KIT-${t}-${randInt(1, 9)}`,
      })),
      releaseDecision: 'released', decidedBy: bbo._id, decidedAt: new Date((d.doc.collectedAt as Date).getTime() + days(2)),
      ...audit,
    });

    const collectedAt = d.doc.collectedAt as Date;
    const comps = d.bag === 'DB' ? ['PRBC', 'FFP'] : ['PRBC', 'FFP', 'RDP'];
    const volumes: Record<string, number> = d.bag === 'DB' ? { PRBC: 220, FFP: 130 } : { PRBC: 200, FFP: 100, RDP: 50 };
    for (const comp of comps) {
      const expiresAt = comp === 'RDP' ? new Date(collectedAt.getTime() + days(5))
        : comp === 'FFP' ? new Date(collectedAt.getTime() + days(365))
        : new Date(collectedAt.getTime() + days(35));
      const unit = await BloodUnitModel.create({
        unitId: `UNIT-2026-${pad(unitSeq++, 5)}`,
        donationId: d.doc.donationId, componentType: comp,
        aboGroup: d.donor.bloodGroup, rhFactor: d.donor.rh,
        volumeMl: volumes[comp], collectedAt, expiresAt, status: 'RELEASED',
        statusHistory: [{ to: 'RELEASED', event: 'SEED', actor: admin._id, at: new Date(), reason: 'seed: TTI released, component separated' }],
        specialAttributes: [], createdBy: labComp._id, updatedBy: labComp._id,
      });
      newReleasedUnits.push(unit);
    }
  }
  console.log('TTI results: 80 (all released) | new blood units:', newReleasedUnits.length, '(no whole-blood units kept — always split)');

  // ── 6. HOSPITALS (5) ─────────────────────────────────────────────────────
  const hospSeq = await nextSeq(HospitalModel, 'hospitalId', 'HOSP-');
  const hospNames = ['Sanjivani General Hospital', 'Noble Multispeciality Hospital', 'City Care Hospital', 'Lifeline Hospital', 'Aastha Hospital'];
  const hospitals = await HospitalModel.create(hospNames.map((name, i) => ({
    hospitalId: `HOSP-${pad(hospSeq + i)}`, name,
    address: `${choice(CITIES)[0]}, Maharashtra`, contactPerson: `Dr. ${choice(LAST)}`,
    phone: `+91-241-23${pad(hospSeq + i, 5)}`, email: `contact@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.test`,
    isActive: true, ...audit,
  })));
  console.log('hospitals:', hospitals.length);

  // ── 7. REQUISITIONS (20): 10 issued+completed, 10 approved+completed (no issue) ─
  const COMPONENTS_REQ = ['PRBC', 'FFP', 'RDP'] as const;
  function makePatient(seq: number, abo: ABO, rh: RH) {
    const sex = chance(0.5) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    return PatientModel.create({
      patientPublicId: `PAT-2026M-${pad(seq)}`, name: `${fn} ${choice(LAST)}`,
      dob: new Date(2026 - randInt(5, 75), randInt(0, 11), randInt(1, 27)), sex,
      medicalRecordNumber: `MRN-M${1000 + seq}`, aboGroup: abo, rhFactor: rh,
      groupConfirmations: [{ aboGroup: abo, rhFactor: rh, sampleId: `MS${seq}a`, determinedBy: mo._id, determinedAt: ago(randInt(1, 5)) }],
      ...audit,
    });
  }

  let patSeq = await nextSeq(PatientModel, 'patientPublicId', 'PAT-2026M-');
  let reqSeq = await nextSeq(RequisitionModel, 'requisitionId', 'REQ-2026-');
  let xmSeq = await nextSeq(CrossmatchModel, 'crossmatchId', 'XM-2026-');
  let issSeq = await nextSeq(IssueModel, 'issueId', 'ISS-2026-');

  const availableUnit = (comp: string, abo: ABO, rh: RH, usedIds: Set<string>) =>
    newReleasedUnits.find((u) => u.status === 'RELEASED' && u.componentType === comp && !usedIds.has(u.unitId) &&
      ((u.aboGroup === abo && u.rhFactor === rh) || u.aboGroup === 'O'));

  const usedForIssue = new Set<string>();
  let reqCreated = 0;

  // 10 requisitions: matched -> crossmatched -> approved -> ISSUED -> COMPLETED
  for (let i = 0; i < 10; i++) {
    const hosp = choice(hospitals);
    const abo = aboPick(); const rh = rhPick();
    const patient = await makePatient(patSeq++, abo, rh);
    const single = i < 6; // 6 single-component, 4 multi-component
    const wantComps = single ? [choice(COMPONENTS_REQ)] : (chance(0.5) ? ['PRBC', 'FFP'] : ['PRBC', 'FFP', 'RDP']);

    const requestedComponents = wantComps.map((c) => ({ componentType: c, units: 1, aboGroup: abo, rhFactor: rh, urgency: choice(['ROUTINE', 'URGENT', 'EMERGENCY'] as const) }));
    const matchedForReq: Array<{ unit: InstanceType<typeof BloodUnitModel>; compType: string }> = [];
    for (const c of wantComps) {
      const u = availableUnit(c, abo, rh, usedForIssue);
      if (u) { matchedForReq.push({ unit: u, compType: c }); usedForIssue.add(u.unitId); }
    }
    if (matchedForReq.length === 0) continue; // no stock match — skip (shouldn't happen given pool size)

    const matchedUnits = matchedForReq.map((m) => ({
      unitId: m.unit.unitId, componentType: m.compType,
      compatibilityType: m.unit.aboGroup === abo ? 'EXACT' : 'COMPATIBLE',
      crossmatchRequired: m.compType === 'PRBC', crossmatchStatus: m.compType === 'PRBC' ? 'COMPATIBLE' : 'NOT_REQUIRED',
    }));

    const requisitionId = `REQ-2026-${pad(reqSeq++)}`;
    const req = await RequisitionModel.create({
      requisitionId, hospitalId: hosp._id, patientId: patient._id,
      clinicianName: `Dr. ${choice(LAST)}`, doctorName: `Dr. ${choice(LAST)}`,
      requiredAt: ago(randInt(0, 2)), requestedAt: ago(randInt(2, 5)),
      patient: { name: patient.name, age: randInt(18, 75), sex: patient.sex as string, mrn: patient.medicalRecordNumber as string, diagnosis: choice(['Anaemia', 'Surgery', 'Trauma', 'Thalassaemia', 'Delivery']), indication: 'Clinical need', hb: 6 + rnd() * 4 },
      requestedComponents, matchedUnits,
      status: 'ISSUED', approvedBy: mo._id, approvedAt: ago(randInt(1, 3)),
      createdBy: hospUser._id, updatedBy: hospUser._id,
    });

    for (const m of matchedForReq) {
      if (m.compType === 'PRBC') {
        await CrossmatchModel.create({
          crossmatchId: `XM-2026-${pad(xmSeq++)}`, requisitionId: req._id, unitId: m.unit.unitId,
          patientId: patient._id, method: choice(['IS', 'AHG', 'ELECTRONIC'] as const),
          phases: { immediateSpin: 'COMPATIBLE', coombsAhg: 'COMPATIBLE' },
          result: 'COMPATIBLE', performedBy: labSero._id, performedAt: ago(randInt(1, 2)), ...audit,
        });
      }
      const iss = await IssueModel.create({
        issueId: `ISS-2026-${pad(issSeq++)}`, requisitionId: req._id, unitId: m.unit.unitId,
        patientId: patient._id, issuedAt: ago(randInt(0, 1)), issuedBy: issueCounter._id,
        collectedByName: `Nurse ${choice(FEMALE)}`, transportTempCelsius: randInt(2, 8), ...audit,
      });
      await BloodUnitModel.updateOne({ _id: m.unit._id }, {
        $set: { status: 'ISSUED', issuedTo: iss._id, issuedAt: new Date(), reservedFor: req._id },
        $push: { statusHistory: { from: 'RELEASED', to: 'ISSUED', event: 'ISSUE', actor: issueCounter._id, at: new Date(), reason: `Issued vs ${requisitionId}` } },
      });
    }
    await RequisitionModel.updateOne({ _id: req._id }, { status: 'COMPLETED' });
    reqCreated++;
  }

  // 10 requisitions: matched -> approved -> COMPLETED, no issue (units stay RELEASED)
  for (let i = 0; i < 10; i++) {
    const hosp = choice(hospitals);
    const abo = aboPick(); const rh = rhPick();
    const patient = await makePatient(patSeq++, abo, rh);
    const single = i < 6;
    const wantComps = single ? [choice(COMPONENTS_REQ)] : (chance(0.5) ? ['PRBC', 'FFP'] : ['PRBC', 'FFP', 'RDP']);
    const requestedComponents = wantComps.map((c) => ({ componentType: c, units: 1, aboGroup: abo, rhFactor: rh, urgency: choice(['ROUTINE', 'URGENT', 'EMERGENCY'] as const) }));

    // Reference (but do not consume) matching RELEASED units for the "matched" display.
    const matchedUnits = wantComps.map((c) => {
      const u = newReleasedUnits.find((x) => x.status === 'RELEASED' && x.componentType === c && (x.aboGroup === abo || x.aboGroup === 'O'));
      return u ? { unitId: u.unitId, componentType: c, compatibilityType: u.aboGroup === abo ? 'EXACT' : 'COMPATIBLE', crossmatchRequired: false, crossmatchStatus: 'NOT_REQUIRED' } : null;
    }).filter(Boolean) as any[];

    const requisitionId = `REQ-2026-${pad(reqSeq++)}`;
    await RequisitionModel.create({
      requisitionId, hospitalId: hosp._id, patientId: patient._id,
      clinicianName: `Dr. ${choice(LAST)}`, doctorName: `Dr. ${choice(LAST)}`,
      requiredAt: ago(randInt(0, 2)), requestedAt: ago(randInt(2, 5)),
      patient: { name: patient.name, age: randInt(18, 75), sex: patient.sex as string, mrn: patient.medicalRecordNumber as string, diagnosis: choice(['Anaemia', 'Surgery', 'Trauma', 'Delivery']), indication: 'Clinical need', hb: 6 + rnd() * 4 },
      requestedComponents, matchedUnits,
      status: 'COMPLETED', approvedBy: mo._id, approvedAt: ago(randInt(1, 3)),
      createdBy: hospUser._id, updatedBy: hospUser._id,
    });
    reqCreated++;
  }
  console.log('requisitions:', reqCreated, '(10 issued+completed, 10 approved+completed without issuing)');

  // ── 8. CAMPS (3 x 30 donors, 25 donate + separate + serology, 5 deferred) ─
  const campSeq = await nextSeq(CampModel, 'campId', 'CAMP-');
  const campDefs = [
    { name: 'Rotary Club Blood Donation Drive', place: 'Rotary Hall' },
    { name: 'College NSS Blood Donation Camp', place: 'Engineering College Grounds' },
    { name: 'IT Park Community Blood Camp', place: 'IT Park Auditorium' },
  ];
  let campDonorSeq = donorSeq;
  for (let c = 0; c < 3; c++) {
    const from = ago(randInt(20, 60));
    const to = new Date(from.getTime() + days(1));
    const camp = await CampModel.create({
      campId: `CAMP-${pad(campSeq + c)}`, name: campDefs[c]!.name, description: 'Community blood donation camp',
      address: `${campDefs[c]!.place}, ${choice(CITIES)[0]}, MH`,
      contactInfo: { phone: `+91-241-24${pad(c, 5)}`, email: `camp${campSeq + c}@camp.test` },
      dateFrom: from, dateTo: to, createdBy: campOrg._id, lastUpdatedBy: campOrg._id,
      staff: [phlebo._id, mo._id],
    });

    const campDonors: InstanceType<typeof DonorModel>[] = [];
    for (let i = 0; i < 30; i++) campDonors.push(await DonorModel.create({ ...makeDonor(campDonorSeq++), eligibilityStatus: 'eligible' }));

    // 5 deferred at screening (3 temporary, 2 permanent) — no donation.
    const deferredCampDonors = campDonors.slice(25, 30);
    for (const [i, d] of deferredCampDonors.entries()) {
      const temp = i < 3;
      await DonorModel.updateOne({ _id: d._id }, { eligibilityStatus: temp ? 'temp-deferred' : 'deferred' });
      await DeferralModel.create({
        donor: d._id, type: temp ? 'TEMPORARY' : 'PERMANENT',
        reason: temp ? choice(TEMP_REASONS) : choice(PERM_REASONS),
        untilDate: temp ? ahead(randInt(15, 90)) : null,
        source: temp ? 'VITALS' : 'MANUAL', decidedBy: mo._id, ...audit,
      });
      await CampDonationModel.create({
        firstName: d.name!.firstName, lastName: d.name!.lastName, sex: d.sex === 'O' ? 'OTHER' : d.sex,
        dob: d.dob, age: 2026 - (d.dob as Date).getFullYear(), occupation: d.occupation,
        address: `${d.address.city}, MH`, mobile: d.phone, pincode: d.address.pincode ?? '414001',
        email: d.email, isFirstTime: chance(0.4), isRepeated: chance(0.3), totalDonations: randInt(0, 5),
        weight: d.weightKg, hb: temp && TEMP_REASONS.includes('High haemoglobin') ? 18.5 : 11 + rnd() * 2,
        temp: 36.5 + rnd(), pulse: randInt(65, 90), bp: `${randInt(110, 130)}/${randInt(70, 88)}`,
        o2Level: randInt(96, 100), bloodGroup: `${d.bloodGroup}${d.rh === 'POSITIVE' ? '+' : '-'}`,
        campId: camp._id, status: 'REJECTED',
      });
    }

    // 25 donate: alternate DOUBLE/TRIPLE bag, full TTI + separation.
    const donatingCampDonors = campDonors.slice(0, 25);
    const campUnitIds: mongoose.Types.ObjectId[] = [];
    for (const [i, d] of donatingCampDonors.entries()) {
      const bagKind: BagKind = i % 2 === 0 ? 'DB' : 'TB';
      const collectedAt = new Date(from.getTime() + days(0) + i * 60000);
      const donationId = `DON-2026-${pad(donationSeq++)}`;
      const donDoc = await DonationModel.create({
        donationId, bagNo: `CBAG${9000 + donationSeq}`, segmentNo: `CSEG${donationSeq}`, lotNo: `LOT-C${donationSeq}`,
        donor: d._id, donationType: 'WHOLE_BLOOD', collectedAt, campId: camp._id, phlebotomistId: phlebo._id,
        medicalExam: {
          weightKg: d.weightKg, hbGdl: 12.5 + rnd() * 4, temperatureCelsius: 36.5 + rnd(),
          pulseBpm: randInt(65, 90), bloodPressure: { systolic: randInt(110, 130), diastolic: randInt(70, 88) },
          oxygenSaturationPercent: randInt(96, 100), skinClearAtPhlebotomy: true, armsFreeOfPunctureScars: true, volumeMl: 350,
        },
        donorFitness: { isFit: true }, typeOfBag: bagKind, createdBy: phlebo._id, updatedBy: phlebo._id,
      });

      await TtiResultModel.create({
        donationId, aboGroupConfirmed: d.bloodGroup, rhFactorConfirmed: d.rh,
        tests: TTI_TESTS.map((t) => ({ testName: t, method: 'ELISA', result: 'NEGATIVE', technicianId: labSero._id, performedAt: new Date(collectedAt.getTime() + days(1)), kitLot: `KIT-${t}-C${randInt(1, 9)}` })),
        releaseDecision: 'released', decidedBy: bbo._id, decidedAt: new Date(collectedAt.getTime() + days(2)), ...audit,
      });

      const comps = bagKind === 'DB' ? ['PRBC', 'FFP'] : ['PRBC', 'FFP', 'RDP'];
      const volumes: Record<string, number> = bagKind === 'DB' ? { PRBC: 220, FFP: 130 } : { PRBC: 200, FFP: 100, RDP: 50 };
      for (const comp of comps) {
        const expiresAt = comp === 'RDP' ? new Date(collectedAt.getTime() + days(5))
          : comp === 'FFP' ? new Date(collectedAt.getTime() + days(365))
          : new Date(collectedAt.getTime() + days(35));
        const unit = await BloodUnitModel.create({
          unitId: `UNIT-2026-${pad(unitSeq++, 5)}`, donationId, componentType: comp,
          aboGroup: d.bloodGroup, rhFactor: d.rh, volumeMl: volumes[comp], collectedAt, expiresAt, status: 'RELEASED',
          statusHistory: [{ to: 'RELEASED', event: 'SEED', actor: admin._id, at: new Date(), reason: 'seed: camp donation, TTI released, separated' }],
          campId: camp._id, createdBy: labComp._id, updatedBy: labComp._id,
        });
        campUnitIds.push(unit._id as mongoose.Types.ObjectId);
        newReleasedUnits.push(unit);
      }

      await CampDonationModel.create({
        firstName: d.name!.firstName, lastName: d.name!.lastName, sex: d.sex === 'O' ? 'OTHER' : d.sex,
        dob: d.dob, age: 2026 - (d.dob as Date).getFullYear(), occupation: d.occupation,
        address: `${d.address.city}, MH`, mobile: d.phone, pincode: d.address.pincode ?? '414001',
        email: d.email, isFirstTime: chance(0.4), isRepeated: chance(0.3), totalDonations: randInt(0, 5),
        weight: d.weightKg, hb: 12.5 + rnd() * 4, temp: 36.5 + rnd(), pulse: randInt(65, 90),
        bp: `${randInt(110, 130)}/${randInt(70, 88)}`, o2Level: randInt(96, 100),
        bloodGroup: `${d.bloodGroup}${d.rh === 'POSITIVE' ? '+' : '-'}`, campId: camp._id,
        bagNo: donDoc.bagNo, segmentNo: donDoc.segmentNo, typeOfBag: bagKind, status: 'DONATED',
      });
    }

    await CampModel.updateOne({ _id: camp._id }, { $set: { unitData: campUnitIds, donorData: campDonors.map((d) => d._id) } });
    console.log(`camp ${c + 1}/3 (${camp.campId}): 30 donors, 25 donated+separated+tested, 5 deferred`);
  }

  // ── 9. INVENTORY RESERVATIONS (8: 5 single, 3 multi-component) ───────────
  const usedForReserve = new Set<string>(usedForIssue);
  let reserveCreated = 0;
  for (let i = 0; i < 8; i++) {
    const abo = aboPick(); const rh = rhPick();
    const single = i < 5;
    const wantComps = single ? [choice(COMPONENTS_REQ)] : (chance(0.5) ? ['PRBC', 'FFP'] : ['PRBC', 'FFP', 'RDP']);
    const matchedForReq: Array<{ unit: InstanceType<typeof BloodUnitModel>; compType: string }> = [];
    for (const c of wantComps) {
      const u = availableUnit(c, abo, rh, usedForReserve);
      if (u) { matchedForReq.push({ unit: u, compType: c }); usedForReserve.add(u.unitId); }
    }
    if (matchedForReq.length === 0) continue;

    const sex = chance(0.5) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    const age = randInt(18, 75);
    const dob = new Date(2026 - age, randInt(0, 11), randInt(1, 27));
    const patient = await PatientModel.create({
      patientPublicId: `PA-RSV-${Date.now().toString().slice(-8)}${i}`,
      name: `${fn} ${choice(LAST)}`, dob, sex, medicalRecordNumber: `MRN-RSV-${1000 + i}`,
      createdBy: admin._id, updatedBy: admin._id,
    });

    const hosp = choice(hospitals);
    const requisitionId = `REQ-2026-${pad(reqSeq++)}`;
    const reservedUntil = ahead(3);
    const requestedComponents = matchedForReq.map((m) => ({ componentType: m.compType, units: 1, aboGroup: abo, rhFactor: rh, urgency: 'ROUTINE' as const }));
    const matchedUnits = matchedForReq.map((m) => ({
      unitId: m.unit.unitId, componentType: m.compType,
      compatibilityType: m.unit.aboGroup === abo ? 'EXACT' : 'COMPATIBLE', crossmatchRequired: false, crossmatchStatus: 'NOT_REQUIRED',
    }));
    const requisition = await RequisitionModel.create({
      requisitionId, hospitalId: hosp._id, patientId: patient._id, clinicianName: `Dr. ${choice(LAST)}`,
      doctorName: `Dr. ${choice(LAST)}`, requiredAt: reservedUntil,
      patient: { name: patient.name, age, sex, mrn: patient.medicalRecordNumber as string, diagnosis: choice(['Elective surgery', 'Anaemia workup', 'Scheduled transfusion']), indication: 'Reserved via inventory wizard', hb: 8 + rnd() * 3 },
      requestedComponents, matchedUnits, status: 'MATCHED',
      createdBy: admin._id, updatedBy: admin._id,
    });

    for (const m of matchedForReq) {
      await BloodUnitModel.updateOne({ _id: m.unit._id }, {
        $set: { status: 'RESERVED', reservedFor: requisition._id, reservedAt: new Date(), reservedUntil, updatedBy: admin._id },
        $push: { statusHistory: { from: 'RELEASED', to: 'RESERVED', event: 'RESERVE', actor: admin._id, at: new Date(), reason: `Reserved for requisition ${requisitionId} via Reserve Wizard` } },
      });
    }
    reserveCreated++;
  }
  console.log('inventory reservations:', reserveCreated, '(5 single-component, 3 multi-component target)');

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n=== SEED (additive) COMPLETE ===');
  console.log(`Login for any seeded staff account: <email> / ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('SEED FAILED:', e); process.exit(1); });
