/* eslint-disable no-console */
// Comprehensive, scaled seed for the BloodBank database.
// Builds a referentially-consistent dataset across the full lifecycle at
// volume: ~100 donors, ~70 donations, ~120 blood units, ~30 patients,
// ~28 requisitions with full crossmatch→issue→transfusion→reaction
// chains, plus the procurement chain (PO→GRN→stock→inspection→issue→
// discard), chemical inventory, deferrals, camp donations and audit log.
//
// Idempotent: clears every seeded collection first, then re-inserts.
//   npx tsx scripts/seed.ts

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PERMISSION } from '@/shared/enums';
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
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { AdverseReactionModel } from '@/modules/adverse-reaction/adverse-reaction.model';
import { PurchaseOrderModel } from '@/modules/purchase-order/purchase-order.model';
import { GoodsReceiptModel } from '@/modules/goods-receipt/goods-receipt.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { BagIssueModel } from '@/modules/bag-issue/bag-issue.model';
import { BagDiscardModel } from '@/modules/bag-discard/bag-discard.model';
import { AuditLogModel } from '@/modules/audit/audit.model';
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
const ADMIN_EMAIL = 'smitrajbankar11@gmail.com';

// ── volume knobs ────────────────────────────────────────────────────────────
const N_DONORS = 300;
const N_DONATIONS = 220;
const N_PATIENTS = 90;
const N_REQUISITIONS = 90;
const N_FULL_CHAINS = 55; // requisitions taken all the way to transfusion
const N_CAMP_DONATIONS = 100;
const N_BAG_ISSUES = 140;
const N_HOSPITALS = 15;
const N_VENDORS = 8;
const N_CAMPS = 12;
const N_PURCHASE_ORDERS = 14;
const N_CHEM_PURCHASES = 12;
const N_BAG_DISCARDS = 16;

// ── deterministic RNG (LCG) so reruns are reproducible ──────────────────────
let _seed = 1234567;
const rnd = () => ((_seed = (_seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const randInt = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const choice = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

const days = (n: number) => n * 24 * 60 * 60 * 1000;
const ago = (n: number) => new Date(Date.now() - days(n));
const ahead = (n: number) => new Date(Date.now() + days(n));
const pad = (n: number, w = 4) => String(n).padStart(w, '0');

const MALE = ['Rahul', 'Vikram', 'Amit', 'Deepak', 'Manoj', 'Suresh', 'Rohit', 'Nikhil', 'Arjun', 'Kiran', 'Sachin', 'Ganesh', 'Prashant', 'Yogesh', 'Akash'];
const FEMALE = ['Anjali', 'Pooja', 'Sunita', 'Kavya', 'Reena', 'Priya', 'Sneha', 'Manisha', 'Aarti', 'Neha', 'Swati', 'Divya', 'Komal', 'Shraddha', 'Madhuri'];
const LAST = ['Sharma', 'Patil', 'Singh', 'Joshi', 'Kumar', 'Rao', 'Verma', 'Nair', 'Pawar', 'Shah', 'Deshmukh', 'Kulkarni', 'Gupta', 'Iyer', 'Jadhav', 'More', 'Shinde', 'Bhosale'];
const CITIES: Array<[string, string, string]> = [
  ['Ahmednagar', 'Ahmednagar', '414001'], ['Pune', 'Pune', '411001'], ['Nashik', 'Nashik', '422001'],
  ['Aurangabad', 'Aurangabad', '431001'], ['Mumbai', 'Mumbai', '400001'], ['Solapur', 'Solapur', '413001'],
];
const OCCUPATIONS = ['Teacher', 'Engineer', 'Farmer', 'Clerk', 'Student', 'Businessman', 'Nurse', 'Driver'];

type ABO = 'O' | 'A' | 'B' | 'AB';
type RH = 'POSITIVE' | 'NEGATIVE';
// Weighted realistic distribution (India-ish).
const ABO_WEIGHTED: ABO[] = [...Array(37).fill('O'), ...Array(28).fill('B'), ...Array(24).fill('A'), ...Array(11).fill('AB')] as ABO[];
const rhPick = (): RH => (chance(0.92) ? 'POSITIVE' : 'NEGATIVE');
const aboPick = (): ABO => choice(ABO_WEIGHTED);

async function clearAll() {
  const models = [
    UserModel, HospitalModel, VendorModel, CampModel, CampDonationModel,
    DonorModel, DeferralModel, DonationModel, TtiResultModel, BloodUnitModel,
    PatientModel, RequisitionModel, CrossmatchModel, IssueModel, TransfusionModel,
    AdverseReactionModel, PurchaseOrderModel, GoodsReceiptModel, BagStockModel,
    BagInspectionModel, BagIssueModel, BagDiscardModel, AuditLogModel,
    ChemicalCategoryModel, ChemicalManufacturerModel, ChemicalSupplierModel,
    ChemicalModel, ChemicalPurchaseModel, ChemicalStockLotModel, ChemicalStockHistoryModel,
  ];
  for (const m of models) await m.deleteMany({});
  console.log('cleared', models.length, 'collections');
}

async function main() {
  const uri = process.env.MONGODB_URI!;
  console.log('connecting', uri.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(uri, { dbName: 'BloodBank', serverSelectionTimeoutMS: 8000 });
  console.log('connected');
  await clearAll();

  // ── 1. USERS (one per role) ──────────────────────────────────────────────
  const roleUsers: Array<{ role: string; first: string; last: string; email: string }> = [
    { role: 'system-admin', first: 'Smitraj', last: 'Bankar', email: ADMIN_EMAIL },
    { role: 'bbo', first: 'Bhushan', last: 'Officer', email: 'bbo@sanjivani.test' },
    { role: 'medical-officer', first: 'Meera', last: 'Doctor', email: 'mo@sanjivani.test' },
    { role: 'counsellor', first: 'Chetan', last: 'Counsel', email: 'counsellor@sanjivani.test' },
    { role: 'phlebotomist', first: 'Priya', last: 'Phlebo', email: 'phlebo@sanjivani.test' },
    { role: 'lab-tech-component', first: 'Lalit', last: 'Component', email: 'labcomp@sanjivani.test' },
    { role: 'lab-tech-serology', first: 'Sneha', last: 'Serology', email: 'labsero@sanjivani.test' },
    { role: 'store-keeper', first: 'Sanjay', last: 'Store', email: 'store@sanjivani.test' },
    { role: 'issue-counter', first: 'Ishan', last: 'Counter', email: 'issue@sanjivani.test' },
    { role: 'apheresis-tech', first: 'Asha', last: 'Apheresis', email: 'apheresis@sanjivani.test' },
    { role: 'qa-manager', first: 'Qadir', last: 'Quality', email: 'qa@sanjivani.test' },
    { role: 'auditor', first: 'Anil', last: 'Audit', email: 'auditor@sanjivani.test' },
    { role: 'camp-organiser', first: 'Karan', last: 'Camp', email: 'camp@sanjivani.test' },
    { role: 'hospital-user', first: 'Hema', last: 'Hospital', email: 'hospital@sanjivani.test' },
  ];
  // Full permission grid (every module, all CRUD flags) for the admin.
  const fullGrid = Array.from(new Set(PERMISSION.map((p) => p.split(':')[0]))).map((moduleName) => ({
    moduleName, view: true, create: true, update: true, delete: true,
  }));
  const users: Record<string, InstanceType<typeof UserModel>> = {};
  let userSeq = 1;
  for (const u of roleUsers) {
    users[u.role] = await UserModel.create({
      publicId: `USR-2026-${pad(userSeq++)}`,
      name: { first: u.first, last: u.last },
      email: u.email, phone: `+9198${pad(20000000 + userSeq, 8)}`,
      role: u.role, password: PASSWORD, status: 'active',
      permissions: u.role === 'system-admin' ? fullGrid : [],
    });
  }
  const admin = users['system-admin']._id;
  const tech = users['lab-tech-serology']._id;
  const mo = users['medical-officer']._id;
  const phlebo = users['phlebotomist']._id;
  const audit = { createdBy: admin, updatedBy: admin };
  console.log('users:', Object.keys(users).length);

  // ── 2. HOSPITALS ─────────────────────────────────────────────────────────
  const hospNames = ['Sanjivani General', 'Noble Multispeciality', 'City Care', 'Lifeline', 'Aastha', 'Suyog', 'Sahyadri', 'Jeevan Jyoti', 'Aditya', 'Krishna', 'Sushrut', 'Apex', 'Ruby Hall', 'Wockhardt', 'Deenanath'];
  const hospitals = await HospitalModel.create(Array.from({ length: N_HOSPITALS }, (_, i) => ({
    hospitalId: `HOSP-${pad(i + 1)}`, name: `${hospNames[i % hospNames.length]} Hospital ${i + 1}`,
    address: `${CITIES[i % CITIES.length][0]}, MH`, contactPerson: `Dr. ${choice(LAST)}`,
    phone: `+91-241-22${pad(i, 5)}`, email: `contact${i + 1}@hosp.test`,
    isActive: chance(0.9), ...audit,
  })));
  console.log('hospitals:', hospitals.length);

  // ── 3. VENDORS (most APPROVED; a couple PENDING/SUSPENDED) ────────────────
  const vendorDefs: Array<[string, string]> = [
    ['Terumo Penpol Supplies', 'Terumo Penpol'], ['HLL Lifecare Distributors', 'HLL Lifecare'],
    ['Fresenius Kabi Agency', 'Fresenius Kabi'], ['Macopharma India', 'Macopharma'],
    ['Span Biomedical', 'Span Diagnostics'], ['JMS Healthcare', 'JMS Singapore'],
    ['Poly Medicure Ltd', 'Polymed'], ['Generic BioBags', 'BioBags Ltd'],
  ];
  const vendors = await VendorModel.create(Array.from({ length: N_VENDORS }, (_, i) => {
    const [name, mfr] = vendorDefs[i % vendorDefs.length];
    const status = i < N_VENDORS - 2 ? 'APPROVED' : i === N_VENDORS - 1 ? 'PENDING' : 'SUSPENDED';
    return {
      vendorId: `VEN-${pad(i + 1)}`, name, manufacturer: mfr,
      drugLicenseNo: `DL-MH-2024-${1001 + i}`, gstNo: `27AABC${pad(1000 + i, 4)}A1Z${i % 10}`,
      address: `${choice(CITIES)[0]}, India`, contactPerson: choice(LAST),
      contactPhone: `+91-22-28${pad(i, 5)}`, email: `sales${i + 1}@vendor.test`,
      approvalStatus: status, contractStart: ago(200), contractEnd: ahead(500), ...audit,
    };
  }));
  const approvedVendors = vendors.filter((v) => v.approvalStatus === 'APPROVED');
  console.log('vendors:', vendors.length, `(${approvedVendors.length} approved)`);

  // ── 4. CAMPS (first half past, rest upcoming) ────────────────────────────
  const camps = await CampModel.create(Array.from({ length: N_CAMPS }, (_, i) => {
    const past = i < N_CAMPS / 2;
    const from = past ? ago(randInt(15, 120)) : ahead(randInt(5, 90));
    return {
      campId: `CAMP-${pad(i + 1)}`, name: `${choice(['Rotary', 'Lions Club', 'College NSS', 'IT Park', 'Temple Trust', 'Municipal'])} Blood Drive ${i + 1}`,
      description: 'Community donation camp', address: `${choice(CITIES)[0]} Hall`,
      contactInfo: { phone: `+91-241-23${pad(i, 5)}`, email: `camp${i + 1}@camp.test` },
      dateFrom: from, dateTo: new Date(from.getTime() + days(1)),
      createdBy: users['camp-organiser']._id, lastUpdatedBy: users['camp-organiser']._id,
      staff: [phlebo, users['counsellor']._id],
    };
  }));
  const pastCamps = camps.filter((c) => (c.dateFrom as Date) < new Date());
  console.log('camps:', camps.length);

  // ── 5. DONORS (100) ──────────────────────────────────────────────────────
  const donors: InstanceType<typeof DonorModel>[] = [];
  for (let i = 0; i < N_DONORS; i++) {
    const sex = chance(0.55) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    const ln = choice(LAST);
    const [city, district, pincode] = choice(CITIES);
    const age = randInt(18, 64);
    const donorId = `DNR-2026-${pad(i + 1)}`;
    const elig = chance(0.85) ? 'eligible' : chance(0.5) ? 'temp-deferred' : 'deferred';
    donors.push(await DonorModel.create({
      donorId, name: { firstName: fn, lastName: ln },
      uid: `UID${100000 + i}`,
      dob: new Date(2026 - age, randInt(0, 11), randInt(1, 27)),
      sex, phone: `+9197${pad(randInt(10000000, 99999999), 8)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@donor.test`,
      address: { line1: `${randInt(1, 200)} ${choice(['Gandhi', 'Nehru', 'Shivaji', 'Tilak'])} Path`, city, district, state: 'Maharashtra', pincode },
      occupation: choice(OCCUPATIONS), weightKg: randInt(50, 95),
      bloodGroup: aboPick(), rh: rhPick(),
      eligibilityStatus: elig,
      lastDonationDate: chance(0.7) ? ago(randInt(90, 400)) : undefined,
      createdBy: phlebo, updatedBy: phlebo,
    }));
  }
  console.log('donors:', donors.length);

  // ── 6. DEFERRALS (~12) ───────────────────────────────────────────────────
  const deferralDocs = [];
  for (const d of donors.filter((x) => x.eligibilityStatus !== 'eligible').slice(0, 12)) {
    const temp = d.eligibilityStatus === 'temp-deferred';
    deferralDocs.push({
      donor: d._id, type: temp ? 'TEMPORARY' : 'PERMANENT',
      reason: temp ? choice(['Low haemoglobin', 'Recent fever', 'Tattoo < 6 months', 'Travel to malaria zone']) : choice(['High-risk behaviour', 'Chronic illness']),
      untilDate: temp ? ahead(randInt(15, 90)) : null,
      source: temp ? choice(['VITALS', 'QUESTIONNAIRE']) : 'MANUAL',
      decidedBy: mo, ...audit,
    });
  }
  await DeferralModel.create(deferralDocs);
  console.log('deferrals:', deferralDocs.length);

  // ── 7. DONATIONS (72) ────────────────────────────────────────────────────
  const DONATION_TYPES = ['WHOLE_BLOOD', 'WHOLE_BLOOD', 'WHOLE_BLOOD', 'WHOLE_BLOOD', 'PLASMAPHERESIS', 'PLASMAPHERESIS', 'DOUBLE_RED_CELL'] as const;
  const donations: InstanceType<typeof DonationModel>[] = [];
  for (let i = 0; i < N_DONATIONS; i++) {
    const donor = donors[i]; // first 72 donors donate (distinct)
    const isCamp = chance(0.35) && pastCamps.length > 0;
    // Bias toward recent collections so live inventory isn't all expired
    // (PRBC shelf life is 35d): ~65% within 30d, rest spread to 180d.
    const collectedAt = chance(0.65) ? ago(randInt(1, 28)) : ago(randInt(29, 180));
    donations.push(await DonationModel.create({
      donationId: `DON-2026-${pad(i + 1)}`,
      bagNo: `BAG${5000 + i}`, segmentNo: `SEG${i + 1}`, lotNo: `LOT-${choice(['A', 'B', 'C'])}${i + 1}`,
      donor: donor._id, donationType: choice(DONATION_TYPES), collectedAt,
      campId: isCamp ? choice(pastCamps)._id : undefined,
      phlebotomistId: phlebo,
      medicalExam: {
        weightKg: donor.weightKg, hbGdl: 12.5 + rnd() * 4, temperatureCelsius: 36.5 + rnd(),
        pulseBpm: randInt(65, 90), bloodPressure: { systolic: randInt(110, 130), diastolic: randInt(70, 88) },
        oxygenSaturationPercent: randInt(96, 100), skinClearAtPhlebotomy: true, armsFreeOfPunctureScars: true, volumeMl: 450,
      },
      donorFitness: { isFit: true }, typeOfBag: 'SB',
      createdBy: phlebo, updatedBy: phlebo,
    }));
  }
  console.log('donations:', donations.length);

  // ── 8. TTI RESULTS (one per donation; ~5% reactive) ──────────────────────
  const TTI_TESTS = ['HIV', 'HBSAG', 'HCV', 'SYPHILIS', 'MALARIA'] as const;
  const ttiByDonation = new Map<string, { reactive: boolean; released: boolean }>();
  const ttiDocs = donations.map((don, i) => {
    const reactive = chance(0.05);
    const onHold = !reactive && chance(0.06);
    const released = !reactive && !onHold;
    ttiByDonation.set(don.donationId, { reactive, released });
    const reactiveTest = choice(TTI_TESTS);
    return {
      donationId: don.donationId,
      aboGroupConfirmed: donors[i].bloodGroup, rhFactorConfirmed: donors[i].rh,
      tests: TTI_TESTS.map((t) => ({
        testName: t, method: choice(['ELISA', 'CLIA', 'RAPID'] as const),
        result: reactive && t === reactiveTest ? 'REACTIVE' : 'NEGATIVE',
        technicianId: tech, performedAt: new Date((don.collectedAt as Date).getTime() + days(1)), kitLot: `KIT-${t}-${randInt(1, 9)}`,
      })),
      releaseDecision: reactive ? 'reactive' : onHold ? 'on-hold' : 'released',
      decidedBy: users['bbo']._id, decidedAt: new Date((don.collectedAt as Date).getTime() + days(2)),
      ...audit,
    };
  });
  await TtiResultModel.create(ttiDocs);
  console.log('tti results:', ttiDocs.length);

  // reactive donations → permanent deferral linked for lookback
  const reactiveDons = donations.filter((d) => ttiByDonation.get(d.donationId)!.reactive);
  if (reactiveDons.length) {
    await DeferralModel.create(reactiveDons.map((d) => ({
      donor: d.donor, type: 'PERMANENT', reason: 'TTI reactive result',
      source: 'TTI_REACTIVE', relatedDonationId: d.donationId, decidedBy: users['bbo']._id, ...audit,
    })));
  }

  // ── 9. BLOOD UNITS (component split per donation) ─────────────────────────
  const compsFor = (type: string): string[] => {
    if (type === 'PLASMAPHERESIS') return ['FFP'];
    if (type === 'DOUBLE_RED_CELL') return ['PRBC', 'PRBC'];
    return chance(0.3) ? ['PRBC', 'FFP', 'RDP'] : ['PRBC', 'FFP'];
  };
  const expiryFor = (comp: string, from: Date) => {
    if (comp === 'RDP') return new Date(from.getTime() + days(5));
    if (comp === 'FFP' || comp === 'CRYO') return new Date(from.getTime() + days(365));
    return new Date(from.getTime() + days(35));
  };
  const hist = (to: string, actor: typeof admin, reason = 'seed') => [{ to, event: 'SEED', actor, at: new Date(), reason }];

  const units: InstanceType<typeof BloodUnitModel>[] = [];
  let unitSeq = 1;
  for (let i = 0; i < donations.length; i++) {
    const don = donations[i];
    const donor = donors[i];
    const tti = ttiByDonation.get(don.donationId)!;
    const collectedAt = don.collectedAt as Date;
    for (const comp of compsFor(don.donationType as string)) {
      const expiresAt = expiryFor(comp, collectedAt);
      let status: string;
      let discardReason: string | undefined;
      if (tti.reactive) { status = 'DISCARDED'; discardReason = 'TTI_POSITIVE'; }
      else if (!tti.released) status = 'QUARANTINE';
      else if (expiresAt < new Date()) { status = 'EXPIRED'; }
      else status = 'RELEASED';
      const special: string[] = [];
      if (comp === 'PRBC' && chance(0.12)) special.push(choice(['LEUKOREDUCED', 'IRRADIATED'] as const));
      units.push(await BloodUnitModel.create({
        unitId: `UNIT-2026-${pad(unitSeq++, 5)}`,
        donationId: don.donationId, componentType: comp,
        aboGroup: donor.bloodGroup, rhFactor: donor.rh,
        volumeMl: comp === 'FFP' ? 220 : comp === 'RDP' ? 60 : 280,
        collectedAt, expiresAt, status, statusHistory: hist(status, admin),
        specialAttributes: special,
        campId: don.campId ?? undefined,
        discardReason,
        createdBy: users['lab-tech-component']._id, updatedBy: users['lab-tech-component']._id,
      }));
    }
  }
  const statusCount = units.reduce<Record<string, number>>((a, u) => ((a[u.status as string] = (a[u.status as string] ?? 0) + 1), a), {});
  console.log('blood units:', units.length, statusCount);

  // back-link past camps' donorData / unitData
  for (const camp of pastCamps) {
    const cu = units.filter((u) => String(u.campId) === String(camp._id));
    const cd = donations.filter((d) => String(d.campId) === String(camp._id)).map((d) => d.donor);
    await CampModel.updateOne({ _id: camp._id }, { $set: { unitData: cu.map((u) => u._id), donorData: cd } });
  }

  // ── 10. PATIENTS (30) ────────────────────────────────────────────────────
  const patients: InstanceType<typeof PatientModel>[] = [];
  for (let i = 0; i < N_PATIENTS; i++) {
    const sex = chance(0.5) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    const abo = aboPick(); const rh = rhPick();
    const sn: string[] = [];
    if (chance(0.2)) sn.push(choice(['IRRADIATED', 'CMV_NEGATIVE', 'LEUKOREDUCED'] as const));
    patients.push(await PatientModel.create({
      patientPublicId: `PAT-2026-${pad(i + 1)}`, name: `${fn} ${choice(LAST)}`,
      dob: new Date(2026 - randInt(1, 80), randInt(0, 11), randInt(1, 27)), sex,
      medicalRecordNumber: `MRN-${1000 + i}`, aboGroup: abo, rhFactor: rh,
      groupConfirmations: [
        { aboGroup: abo, rhFactor: rh, sampleId: `S${i}a`, determinedBy: mo, determinedAt: ago(randInt(1, 10)) },
        ...(chance(0.6) ? [{ aboGroup: abo, rhFactor: rh, sampleId: `S${i}b`, determinedBy: tech, determinedAt: ago(randInt(1, 9)) }] : []),
      ],
      antibodyHistory: chance(0.15) ? [{ antibody: choice(['anti-K', 'anti-E', 'anti-D', 'anti-Fya']), identifiedAt: ago(randInt(100, 400)), source: 'panel' }] : [],
      specialNeeds: sn, ...audit,
    }));
  }
  console.log('patients:', patients.length);

  // ── 11–15. REQUISITION → CROSSMATCH → ISSUE → TRANSFUSION → REACTION ─────
  const usedUnit = new Set<string>();
  const releasedRBC = () => units.filter((u) => u.status === 'RELEASED' && !usedUnit.has(u.unitId));
  const REQ_STATUS_NONCHAIN = ['PENDING', 'MATCHED', 'APPROVED', 'REJECTED', 'CROSSMATCHED'] as const;
  const COMPONENTS_REQ = ['PRBC', 'FFP', 'RDP'] as const;

  let xmSeq = 1, issSeq = 1, txnSeq = 1, arSeq = 1, chainsDone = 0;
  const reqDocs: InstanceType<typeof RequisitionModel>[] = [];
  const auditExtra: Array<Record<string, unknown>> = [];

  for (let i = 0; i < N_REQUISITIONS; i++) {
    const hosp = choice(hospitals);
    const pat = patients[i % patients.length];
    const wantComp = choice(COMPONENTS_REQ);
    const reqAbo = pat.aboGroup as ABO; const reqRh = pat.rhFactor as RH;
    // try to grab a matching RELEASED unit
    const candidate = releasedRBC().find((u) => u.aboGroup === reqAbo && u.rhFactor === reqRh)
      ?? releasedRBC().find((u) => u.componentType === 'PRBC');
    const doChain = chainsDone < N_FULL_CHAINS && !!candidate;

    const matchedUnits = candidate ? [{
      unitId: candidate.unitId, componentType: candidate.componentType as string,
      compatibilityType: candidate.aboGroup === reqAbo ? 'EXACT' : 'COMPATIBLE',
      crossmatchRequired: true, crossmatchStatus: doChain ? 'COMPATIBLE' : 'PENDING',
    }] : [];

    const req = await RequisitionModel.create({
      requisitionId: `REQ-2026-${pad(i + 1)}`, hospitalId: hosp._id, patientId: pat._id,
      clinicianName: `Dr. ${choice(LAST)}`, doctorName: `Dr. ${choice(LAST)}`,
      requiredAt: ahead(randInt(-3, 3)), requestedAt: ago(randInt(1, 6)),
      patient: { name: pat.name, age: randInt(18, 80), sex: pat.sex as string, mrn: pat.medicalRecordNumber as string, diagnosis: choice(['Anaemia', 'Surgery', 'Trauma', 'Thalassaemia', 'Delivery']), indication: 'Clinical', hb: 6 + rnd() * 4 },
      requestedComponents: [{ componentType: wantComp, units: randInt(1, 2), aboGroup: reqAbo, rhFactor: reqRh, urgency: choice(['ROUTINE', 'URGENT', 'EMERGENCY']) }],
      matchedUnits,
      status: doChain ? 'ISSUED' : choice(REQ_STATUS_NONCHAIN),
      approvedBy: chance(0.6) ? mo : undefined, approvedAt: chance(0.6) ? ago(randInt(1, 5)) : undefined,
      createdBy: users['hospital-user']._id, updatedBy: users['hospital-user']._id,
    });
    reqDocs.push(req);

    if (doChain && candidate) {
      usedUnit.add(candidate.unitId);
      const isRBC = candidate.componentType === 'PRBC' || candidate.componentType === 'WB';
      if (isRBC) {
        await CrossmatchModel.create({
          crossmatchId: `XM-2026-${pad(xmSeq++)}`, requisitionId: req._id, unitId: candidate.unitId,
          patientId: pat._id, method: choice(['IS', 'AHG', 'ELECTRONIC']),
          phases: { immediateSpin: 'COMPATIBLE', coombsAhg: 'COMPATIBLE' },
          result: 'COMPATIBLE', performedBy: tech, performedAt: ago(randInt(1, 4)), ...audit,
        });
      }
      const iss = await IssueModel.create({
        issueId: `ISS-2026-${pad(issSeq++)}`, requisitionId: req._id, unitId: candidate.unitId,
        patientId: pat._id, issuedAt: ago(randInt(1, 4)), issuedBy: users['issue-counter']._id,
        collectedByName: `Nurse ${choice(FEMALE)}`, transportTempCelsius: randInt(2, 8), ...audit,
      });
      await BloodUnitModel.updateOne({ _id: candidate._id }, {
        $set: { status: 'ISSUED', issuedTo: iss._id, issuedAt: ago(randInt(1, 4)), reservedFor: req._id },
        $push: { statusHistory: { from: 'RELEASED', to: 'ISSUED', event: 'ISSUE', actor: users['issue-counter']._id, at: new Date() } },
      });

      // most issued units get transfused
      if (chance(0.85)) {
        const hadReaction = chance(0.2);
        const txn = await TransfusionModel.create({
          transfusionId: `TXN-2026-${pad(txnSeq++)}`, issueId: iss._id, unitId: candidate.unitId, patientId: pat._id,
          bedsideCheck: { checkedById: mo, witnessedById: users['counsellor']._id, patientIdConfirmed: true, unitIdConfirmed: true, compatibilityConfirmed: true },
          startedAt: ago(randInt(1, 3)), endedAt: ago(randInt(0, 1)),
          outcome: hadReaction ? 'STOPPED_REACTION' : 'COMPLETED', hadReaction,
          vitalsLog: [{ at: ago(randInt(1, 3)), temperatureCelsius: 37 + rnd(), pulseBpm: randInt(70, 95), bloodPressure: '120/80', respiratoryRate: randInt(14, 20) }],
          ...audit,
        });
        await BloodUnitModel.updateOne({ _id: candidate._id }, { $set: { status: 'TRANSFUSED', transfusedTo: txn._id, transfusedAt: ago(randInt(0, 1)) } });
        auditExtra.push({ actor: users['issue-counter']._id, action: 'ISSUE', entityType: 'BloodUnit', entityId: candidate.unitId, reason: `Issued vs ${req.requisitionId}`, at: ago(randInt(1, 4)) });

        if (hadReaction) {
          await AdverseReactionModel.create({
            reactionId: `AR-2026-${pad(arSeq++)}`, transfusionId: txn._id, unitId: candidate.unitId, patientId: pat._id,
            category: choice(['FNHTR', 'ALLERGIC', 'TACO', 'AHTR']), severity: choice(['GRADE_1', 'GRADE_2', 'GRADE_3']),
            onsetMinutesAfterStart: randInt(5, 60), signsSymptoms: choice([['fever', 'chills'], ['urticaria', 'itching'], ['dyspnoea']]),
            investigationsDone: ['DAT', 'repeat crossmatch'], managementGiven: 'Stopped, supportive care', outcome: 'Recovered',
            reportedToHvPI: chance(0.7), reportedAt: ago(randInt(0, 2)), reportedBy: mo, ...audit,
          });
        }
      }
      chainsDone++;
    }
  }
  console.log('requisitions:', reqDocs.length, '| crossmatch:', xmSeq - 1, '| issues:', issSeq - 1, '| transfusions:', txnSeq - 1, '| reactions:', arSeq - 1);

  // ── 16. PROCUREMENT CHAIN ────────────────────────────────────────────────
  const BAG_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'] as const;
  const ANTICO = ['CPDA_1', 'CPD', 'ACD', 'SAG_MANNITOL'] as const;
  const bagStocks: InstanceType<typeof BagStockModel>[] = [];
  let stockSeq = 1;
  for (let p = 0; p < N_PURCHASE_ORDERS; p++) {
    const vendor = approvedVendors[p % approvedVendors.length];
    const li = Array.from({ length: randInt(1, 3) }, () => ({
      bagType: choice(BAG_TYPES), capacityMl: choice([350, 450] as const), anticoagulant: choice(ANTICO),
      productCode: `PC-${randInt(100, 999)}`, quantityOrdered: randInt(50, 300),
    }));
    const po = await PurchaseOrderModel.create({
      poNumber: `PO-2026-${pad(p + 1)}`, poDate: ago(randInt(40, 90)), vendorId: vendor._id, lineItems: li,
      expectedDelivery: ago(randInt(20, 39)), manufacturer: vendor.manufacturer, billDate: ago(randInt(20, 39)),
      notes: 'Quarterly procurement', ...audit,
    });
    const batchLines = li.map((l, k) => ({
      bagType: l.bagType, capacityMl: l.capacityMl, anticoagulant: l.anticoagulant,
      batchNumber: `BATCH-${pad(p + 1)}${k}-${randInt(100, 999)}`, manufacturingDate: ago(150), expiryDate: ahead(randInt(300, 600)),
      quantityReceived: l.quantityOrdered,
    }));
    const grn = await GoodsReceiptModel.create({
      grnNumber: `GRN-2026-${pad(p + 1)}`, poId: po._id, vendorName: vendor.name, invoiceNo: `INV-${vendor.vendorId}-${p}`,
      billDate: ago(randInt(20, 39)), transportDetails: 'Cold chain courier', receivedDate: ago(randInt(18, 38)),
      receivedById: users['store-keeper']._id, batchLines,
      financials: { basicAmountRs: randInt(50000, 200000), cgstRs: 9000, sgstRs: 9000, igstRs: 0, discountRs: 2000, netAmountRs: randInt(60000, 220000) },
      status: 'ACCEPTED', notes: 'Accepted', ...audit,
    });
    for (const bl of batchLines) {
      const received = bl.quantityReceived;
      const stock = await BagStockModel.create({
        stockId: `STK-2026-${pad(stockSeq++)}`, bagType: bl.bagType, capacityMl: bl.capacityMl, anticoagulant: bl.anticoagulant,
        manufacturer: vendor.manufacturer, batchNumber: bl.batchNumber, expiryDate: bl.expiryDate, grnId: grn._id,
        openingStock: 0, receivedQty: received, issuedQty: randInt(0, Math.floor(received / 3)),
        damagedQty: randInt(0, 3), discardedQty: randInt(0, 3), unopenedBoxes: randInt(1, 10),
        status: 'AVAILABLE', lastUpdatedAt: ago(randInt(1, 5)), ...audit,
      });
      bagStocks.push(stock);
      await BagInspectionModel.create({
        inspectionId: `INSP-2026-${pad(stockSeq)}`, grnId: grn._id, stockId: stock._id, batchNumber: bl.batchNumber,
        inspectionDate: ago(randInt(18, 38)), inspectedById: users['qa-manager']._id, sampleSize: randInt(5, 15),
        physicalChecks: { sealIntact: true, noLeakage: true, tubeIntegrity: true, needleCondition: true, labelPresence: true, sterilityCheck: true, packagingCondition: true },
        anticoagulantVolumeOk: true, tubePatency: true, observation: 'Pass', decision: 'ACCEPTED', testingType: 'EMPTY', ...audit,
      });
    }
  }
  console.log(`procurement: PO×${N_PURCHASE_ORDERS}, GRN×${N_PURCHASE_ORDERS}, stock×${bagStocks.length}, inspection×${bagStocks.length}`);

  // bag issues (to collection)
  let bissSeq = 1;
  for (let i = 0; i < N_BAG_ISSUES; i++) {
    const stock = choice(bagStocks);
    const linked = i < donations.length;
    const st = choice(['ISSUED', 'USED', 'USED', 'RETURNED', 'DAMAGED'] as const);
    await BagIssueModel.create({
      issueNumber: `BISS-2026-${pad(bissSeq)}`, issueDate: ago(randInt(1, 60)), stockId: stock._id,
      bagSerialNumber: `SN-${stock.bagType}-${pad(bissSeq++, 6)}`, bagType: stock.bagType, batchNumber: stock.batchNumber,
      issuedById: phlebo, collectionRoom: choice(['Room A', 'Room B', 'Camp Van']),
      donorId: linked ? donations[i].donor : undefined, donationId: linked ? donations[i]._id : undefined,
      status: st, usedAt: st === 'USED' ? ago(randInt(1, 30)) : undefined,
      returnedAt: st === 'RETURNED' ? ago(randInt(1, 30)) : undefined, damagedAt: st === 'DAMAGED' ? ago(randInt(1, 30)) : undefined,
      ...audit,
    });
  }
  // bag discards
  const DISCARD_REASONS = ['EXPIRED', 'LEAKAGE', 'STERILITY_FAILURE', 'DAMAGED_NEEDLE', 'BROKEN_SEAL', 'MANUFACTURING_DEFECT', 'PHYSICAL_DAMAGE', 'TEMPERATURE_EXCURSION', 'QC_FAILURE'] as const;
  for (let i = 0; i < N_BAG_DISCARDS; i++) {
    const stock = choice(bagStocks);
    await BagDiscardModel.create({
      discardId: `BDIS-2026-${pad(i + 1)}`, discardDate: ago(randInt(1, 40)), stockId: stock._id, bagType: stock.bagType,
      batchNumber: stock.batchNumber, quantity: randInt(1, 3), reason: choice(DISCARD_REASONS), reasonDetail: 'QC outcome',
      approvedById: users['qa-manager']._id, approvedAt: ago(randInt(1, 39)), disposalMethod: 'Autoclave + incineration',
      biomedicalWasteManifestNo: `BMW-2026-${pad(i + 1)}`, disposalDate: ago(randInt(0, 38)), ...audit,
    });
  }
  console.log('bag issues:', N_BAG_ISSUES, '| bag discards:', N_BAG_DISCARDS);

  // ── 17. CHEMICAL INVENTORY ───────────────────────────────────────────────
  const cats = await ChemicalCategoryModel.create([
    { name: 'TTI Reagents', description: 'ELISA / rapid test kits', ...audit },
    { name: 'Blood Grouping', description: 'Antisera + cells', ...audit },
    { name: 'Crossmatch', description: 'AHG / Coombs reagents', ...audit },
  ]);
  const mfrs = await ChemicalManufacturerModel.create([
    { name: 'J. Mitra & Co', ...audit }, { name: 'Tulip Diagnostics', ...audit }, { name: 'Span Diagnostics', ...audit },
  ]);
  const sups = await ChemicalSupplierModel.create([
    { name: 'Diagnostics Hub Pvt Ltd', contactPerson: choice(LAST), phone: '+91-22-40000003', email: 'sales@dhub.test', gstNumber: '27AABCD9012C1Z3', address: 'Mumbai, MH', ...audit },
    { name: 'MedSupply Traders', contactPerson: choice(LAST), phone: '+91-20-40000004', email: 'sales@medsupply.test', gstNumber: '27AABCD3456E1Z7', address: 'Pune, MH', ...audit },
  ]);
  const chemNames = ['HIV ELISA Kit', 'HBsAg ELISA Kit', 'HCV ELISA Kit', 'Anti-A Sera', 'Anti-B Sera', 'Anti-D Sera', 'Coombs (AHG) Reagent', 'Malaria Rapid Card'];
  const chems = await ChemicalModel.create(chemNames.map((n, i) => ({
    name: n, categoryId: cats[i % cats.length]._id, manufacturerId: mfrs[i % mfrs.length]._id,
    unitType: choice(['Bottle', 'Kit', 'Card', 'Pack'] as const), minStockLevel: randInt(3, 8), reorderLevel: randInt(9, 15), isActive: true, ...audit,
  })));
  let cinvSeq = 1;
  for (let i = 0; i < N_CHEM_PURCHASES; i++) {
    const sup = choice(sups);
    const pur = await ChemicalPurchaseModel.create({
      invoiceNumber: `CINV-2026-${pad(cinvSeq++)}`, purchaseDate: ago(randInt(10, 60)), supplierId: sup._id,
      totalAmount: randInt(20000, 80000), paidAmount: randInt(10000, 80000), paymentStatus: choice(['Pending', 'Partially Paid', 'Fully Paid'] as const),
      remarks: 'Reagent purchase', ...audit,
    });
    const chem = choice(chems);
    const mfr = mfrs.find((m) => String(m._id) === String(chem.manufacturerId))!;
    const qty = randInt(10, 40);
    const used = randInt(0, qty);
    const lot = await ChemicalStockLotModel.create({
      chemicalId: chem._id, purchaseId: pur._id, purchaseDate: pur.purchaseDate, invoiceNumber: pur.invoiceNumber,
      supplierId: sup._id, manufacturerId: mfr._id, lotNumber: `LOT-${randInt(1000, 9999)}`, batchNumber: `B-${randInt(100, 999)}`,
      mfgDate: ago(randInt(60, 120)), expiryDate: ahead(randInt(120, 400)), qtyPurchased: qty, qtyAvailable: qty - used,
      qtyInUse: Math.min(used, 5), qtyConsumed: Math.max(0, used - 5), costPerUnit: randInt(500, 3000), totalCost: randInt(20000, 80000),
      cgstAmount: 4500, sgstAmount: 4500, cgstPercent: 9, sgstPercent: 9, totalAmount: randInt(20000, 90000), ...audit,
    });
    await ChemicalStockHistoryModel.create([
      { chemicalId: chem._id, lotId: lot._id, action: 'PURCHASE', quantity: qty, remarks: 'Receipt', createdBy: admin },
      { chemicalId: chem._id, lotId: lot._id, action: 'CONSUME', quantity: used, remarks: 'Daily use', createdBy: tech },
    ]);
  }
  console.log(`chemical inventory: cats×3, mfrs×3, suppliers×2, chemicals×8, purchases×${N_CHEM_PURCHASES}, lots×${N_CHEM_PURCHASES}`);

  // ── 18. CAMP DONATIONS ───────────────────────────────────────────────────
  const BG_STR = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
  const campDonDocs = Array.from({ length: N_CAMP_DONATIONS }, (_, i) => {
    const sex = chance(0.55) ? 'M' : 'F';
    const fn = sex === 'M' ? choice(MALE) : choice(FEMALE);
    const age = randInt(18, 60);
    return {
      firstName: fn, lastName: choice(LAST), sex: sex === 'M' ? 'M' : 'F', dob: new Date(2026 - age, randInt(0, 11), randInt(1, 27)), age,
      occupation: choice(OCCUPATIONS), address: `${choice(CITIES)[0]}`, mobile: `+9197${pad(randInt(10000000, 99999999), 8)}`,
      pincode: choice(CITIES)[2], email: `${fn.toLowerCase()}.camp${i}@camp.test`,
      isFirstTime: chance(0.4), isRepeated: chance(0.4), totalDonations: randInt(0, 10), lastDonationDate: chance(0.5) ? ago(randInt(100, 400)) : undefined,
      weight: randInt(50, 90), hb: 12 + rnd() * 4, temp: 36.5 + rnd(), pulse: randInt(65, 90), bp: `${randInt(110, 130)}/${randInt(70, 88)}`,
      o2Level: randInt(96, 100), bloodGroup: choice(BG_STR), campId: choice(camps)._id, bagNo: `CBAG${pad(i + 1)}`, segmentNo: `CSEG${i + 1}`,
      status: choice(['PENDING', 'DONATED', 'DONATED', 'REJECTED'] as const),
    };
  });
  await CampDonationModel.create(campDonDocs);
  console.log('camp donations:', campDonDocs.length);

  // ── 19. AUDIT LOG ────────────────────────────────────────────────────────
  const auditDocs: Array<Record<string, unknown>> = [
    { actor: admin, action: 'LOGIN', entityType: 'User', entityId: String(admin), at: ago(1) },
    ...donations.slice(0, 80).map((d) => ({ actor: users['bbo']._id, action: 'RELEASE', entityType: 'TtiResult', entityId: d.donationId, at: ago(randInt(1, 30)) })),
    ...donors.slice(0, 80).map((d) => ({ actor: phlebo, action: 'CREATE', entityType: 'Donor', entityId: d.donorId, at: ago(randInt(1, 60)) })),
    ...auditExtra,
  ];
  await AuditLogModel.create(auditDocs);
  console.log('audit log:', auditDocs.length);

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  const db = mongoose.connection.db!;
  const cols = await db.listCollections().toArray();
  console.log('\n=== SEED COMPLETE ===');
  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${c.name}: ${await db.collection(c.name).countDocuments()}`);
  }
  console.log(`\nLogin: ${ADMIN_EMAIL} / ${PASSWORD}  (all seeded staff use the same password)`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('SEED FAILED:', e); process.exit(1); });
