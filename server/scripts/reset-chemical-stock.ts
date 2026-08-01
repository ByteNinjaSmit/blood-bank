/* eslint-disable no-console */
// Deletes all chemical STOCK data (lots, purchases, history) while keeping
// ChemicalCategory / ChemicalManufacturer / ChemicalSupplier / Chemical master
// records untouched, then seeds a fresh opening stock of 10 units for a fixed
// list of chemical names.
//
//   npx tsx scripts/reset-chemical-stock.ts

import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { UserModel } from '@/modules/user/user.model';
import {
  ChemicalCategoryModel,
  ChemicalManufacturerModel,
  ChemicalSupplierModel,
  ChemicalModel,
  ChemicalPurchaseModel,
  ChemicalStockLotModel,
  ChemicalStockHistoryModel,
} from '@/modules/chemical-inventory/chemical-inventory.model';

const MONGODB_URI = process.env.MONGODB_URI;

// name -> { unitType, packType, unitsPerPack }
const CHEMICALS: Array<{
  name: string;
  category: string;
  unitType: string;
  packType: 'ML' | 'BOX';
  unitsPerPack: number | null;
}> = [
  {
    name: 'Anti-A',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Anti-B',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Anti-D',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Anti-AB',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Anti-A1',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Anti-H',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Anti-AHG',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'Bovine',
    category: 'Blood Grouping Reagents',
    unitType: 'Bottle',
    packType: 'ML',
    unitsPerPack: null,
  },
  {
    name: 'HIV ELISA',
    category: 'ELISA / Microlisa Kits',
    unitType: 'Kit',
    packType: 'BOX',
    unitsPerPack: 96,
  },
  {
    name: 'HBsAg ELISA',
    category: 'ELISA / Microlisa Kits',
    unitType: 'Kit',
    packType: 'BOX',
    unitsPerPack: 96,
  },
  {
    name: 'HCV ELISA',
    category: 'ELISA / Microlisa Kits',
    unitType: 'Kit',
    packType: 'BOX',
    unitsPerPack: 96,
  },
  {
    name: 'MP ELISA',
    category: 'ELISA / Microlisa Kits',
    unitType: 'Kit',
    packType: 'BOX',
    unitsPerPack: 96,
  },
  {
    name: 'VDRL ELISA',
    category: 'ELISA / Microlisa Kits',
    unitType: 'Kit',
    packType: 'BOX',
    unitsPerPack: 96,
  },
];

async function main() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in the environment.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI, { dbName: 'BloodBank' });
  console.log('Connected.');

  const actor =
    (await UserModel.findOne({ role: 'system-admin' }).lean()) ??
    (await UserModel.findOne().lean());
  if (!actor) {
    console.error('No user found in the database to attribute seeded records to. Aborting.');
    process.exit(1);
  }
  const actorId = actor._id;

  // 1. Delete only stock-related collections — manufacturer/supplier/category/chemical master untouched.
  console.log('Deleting existing chemical stock (lots, purchases, history)...');
  const [lotsDeleted, purchasesDeleted, historyDeleted] = await Promise.all([
    ChemicalStockLotModel.deleteMany({}),
    ChemicalPurchaseModel.deleteMany({}),
    ChemicalStockHistoryModel.deleteMany({}),
  ]);
  console.log(
    `Deleted ${lotsDeleted.deletedCount} lots, ${purchasesDeleted.deletedCount} purchases, ${historyDeleted.deletedCount} history entries.`,
  );

  // 2. Ensure categories exist (find-or-create, don't duplicate).
  const categoryCache = new Map<string, mongoose.Types.ObjectId>();
  async function getOrCreateCategory(name: string) {
    if (categoryCache.has(name)) return categoryCache.get(name)!;
    let cat = await ChemicalCategoryModel.findOne({ name, deletedAt: null });
    if (!cat) {
      cat = await ChemicalCategoryModel.create({ name, createdBy: actorId, updatedBy: actorId });
      console.log(`Created category: ${name}`);
    }
    categoryCache.set(name, cat._id);
    return cat._id;
  }

  // 3. Ensure at least one manufacturer/supplier exists (reuse existing, never delete).
  let manufacturer = await ChemicalManufacturerModel.findOne({ deletedAt: null });
  if (!manufacturer) {
    manufacturer = await ChemicalManufacturerModel.create({
      name: 'General Manufacturer',
      createdBy: actorId,
      updatedBy: actorId,
    });
    console.log('Created fallback manufacturer: General Manufacturer');
  }

  let supplier = await ChemicalSupplierModel.findOne({ deletedAt: null });
  if (!supplier) {
    supplier = await ChemicalSupplierModel.create({
      name: 'General Supplier',
      createdBy: actorId,
      updatedBy: actorId,
    });
    console.log('Created fallback supplier: General Supplier');
  }

  // 4. Find-or-create each Chemical master record, then seed one stock lot with qty 10.
  const purchaseDate = new Date();
  const expiryDate = new Date(purchaseDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  const invoiceNumber = `SEED-INIT-${Date.now()}`;

  const purchase = await ChemicalPurchaseModel.create({
    invoiceNumber,
    purchaseDate,
    supplierId: supplier._id,
    totalAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Pending',
    installments: [],
    remarks: 'Initial opening stock seed',
    createdBy: actorId,
    updatedBy: actorId,
  });

  for (const spec of CHEMICALS) {
    const categoryId = await getOrCreateCategory(spec.category);

    let chemical = await ChemicalModel.findOne({ name: spec.name, deletedAt: null });
    if (!chemical) {
      chemical = await ChemicalModel.create({
        name: spec.name,
        categoryId,
        manufacturerId: manufacturer._id,
        unitType: spec.unitType,
        minStockLevel: 5,
        reorderLevel: 10,
        defaultPackType: spec.packType,
        defaultUnitsPerPack: spec.unitsPerPack ?? 96,
        isActive: true,
        createdBy: actorId,
        updatedBy: actorId,
      });
      console.log(`Created chemical master: ${spec.name}`);
    }

    const lotNumber = `LOT-SEED-${spec.name.replace(/\s+/g, '')}`;
    const lot = await ChemicalStockLotModel.create({
      chemicalId: chemical._id,
      purchaseId: purchase._id,
      purchaseDate,
      invoiceNumber,
      supplierId: supplier._id,
      manufacturerId: manufacturer._id,
      lotNumber,
      batchNumber: 'SEED',
      mfgDate: purchaseDate,
      expiryDate,
      qtyPurchased: 10,
      qtyAvailable: 10,
      qtyInUse: 0,
      qtyConsumed: 0,
      costPerUnit: 0,
      totalCost: 0,
      packType: spec.packType,
      unitsPerPack: spec.unitsPerPack,
      openBoxUnitsRemaining: null,
      cgstAmount: 0,
      sgstAmount: 0,
      totalAmount: 0,
      remarks: 'Initial opening stock seed',
      createdBy: actorId,
      updatedBy: actorId,
    });

    await ChemicalStockHistoryModel.create({
      chemicalId: chemical._id,
      lotId: lot._id,
      action: 'PURCHASE',
      quantity: 10,
      remarks: 'Initial opening stock seed',
      createdBy: actorId,
    });

    console.log(`Seeded stock lot for ${spec.name}: qty 10 (${spec.packType})`);
  }

  console.log(`Done. Seeded ${CHEMICALS.length} chemicals with opening stock of 10 units each.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
