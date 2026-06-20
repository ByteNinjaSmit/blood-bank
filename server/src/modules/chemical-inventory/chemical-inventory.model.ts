import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

// ─── Chemical Category ────────────────────────────────────────────────────────
const ChemicalCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type ChemicalCategory = InferSchemaType<typeof ChemicalCategorySchema>;
export type ChemicalCategoryModel = Model<ChemicalCategory>;
export const ChemicalCategoryModel: ChemicalCategoryModel =
  (mongoose.models.ChemicalCategory as ChemicalCategoryModel | undefined) ??
  mongoose.model<ChemicalCategory>('ChemicalCategory', ChemicalCategorySchema);

// ─── Chemical Supplier ────────────────────────────────────────────────────────
const ChemicalSupplierSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type ChemicalSupplier = InferSchemaType<typeof ChemicalSupplierSchema>;
export type ChemicalSupplierModel = Model<ChemicalSupplier>;
export const ChemicalSupplierModel: ChemicalSupplierModel =
  (mongoose.models.ChemicalSupplier as ChemicalSupplierModel | undefined) ??
  mongoose.model<ChemicalSupplier>('ChemicalSupplier', ChemicalSupplierSchema);

// ─── Chemical Manufacturer ───────────────────────────────────────────────────
const ChemicalManufacturerSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type ChemicalManufacturer = InferSchemaType<typeof ChemicalManufacturerSchema>;
export type ChemicalManufacturerModel = Model<ChemicalManufacturer>;
export const ChemicalManufacturerModel: ChemicalManufacturerModel =
  (mongoose.models.ChemicalManufacturer as ChemicalManufacturerModel | undefined) ??
  mongoose.model<ChemicalManufacturer>('ChemicalManufacturer', ChemicalManufacturerSchema);

// ─── Chemical ─────────────────────────────────────────────────────────────────
const ChemicalSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ChemicalCategory', required: true, index: true },
    manufacturerId: { type: Schema.Types.ObjectId, ref: 'ChemicalManufacturer', required: true, index: true },
    unitType: { type: String, enum: ['Bottle', 'Kit', 'Card', 'Pack', 'Bag'], required: true },
    minStockLevel: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type Chemical = InferSchemaType<typeof ChemicalSchema>;
export type ChemicalModel = Model<Chemical>;
export const ChemicalModel: ChemicalModel =
  (mongoose.models.Chemical as ChemicalModel | undefined) ??
  mongoose.model<Chemical>('Chemical', ChemicalSchema);

// ─── Chemical Purchase ────────────────────────────────────────────────────────
const ChemicalPurchaseSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    purchaseDate: { type: Date, required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'ChemicalSupplier', required: true, index: true },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Fully Paid'],
      default: 'Pending',
      index: true,
    },
    installments: [
      {
        amount: { type: Number, required: true },
        paymentDate: { type: Date, required: true },
        remarks: { type: String, trim: true },
      },
    ],
    remarks: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type ChemicalPurchase = InferSchemaType<typeof ChemicalPurchaseSchema>;
export type ChemicalPurchaseModel = Model<ChemicalPurchase>;
export const ChemicalPurchaseModel: ChemicalPurchaseModel =
  (mongoose.models.ChemicalPurchase as ChemicalPurchaseModel | undefined) ??
  mongoose.model<ChemicalPurchase>('ChemicalPurchase', ChemicalPurchaseSchema);

// ─── Chemical Stock Lot ───────────────────────────────────────────────────────
const ChemicalStockLotSchema = new Schema(
  {
    chemicalId: { type: Schema.Types.ObjectId, ref: 'Chemical', required: true, index: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'ChemicalPurchase', default: null, index: true },
    purchaseDate: { type: Date, required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'ChemicalSupplier', required: true, index: true },
    manufacturerId: { type: Schema.Types.ObjectId, ref: 'ChemicalManufacturer', required: true },
    lotNumber: { type: String, required: true, trim: true, index: true },
    batchNumber: { type: String, required: true, trim: true },
    mfgDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    qtyPurchased: { type: Number, required: true, min: 1 },
    qtyAvailable: { type: Number, required: true, min: 0 },
    qtyInUse: { type: Number, required: true, min: 0 },
    qtyConsumed: { type: Number, required: true, min: 0 },
    costPerUnit: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    packSizeMl: { type: Number, default: null },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    cgstPercent: { type: Number, default: 0 },
    sgstPercent: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    remarks: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type ChemicalStockLot = InferSchemaType<typeof ChemicalStockLotSchema>;
export type ChemicalStockLotModel = Model<ChemicalStockLot>;
export const ChemicalStockLotModel: ChemicalStockLotModel =
  (mongoose.models.ChemicalStockLot as ChemicalStockLotModel | undefined) ??
  mongoose.model<ChemicalStockLot>('ChemicalStockLot', ChemicalStockLotSchema);

// ─── Chemical Stock History ───────────────────────────────────────────────────
const ChemicalStockHistorySchema = new Schema(
  {
    chemicalId: { type: Schema.Types.ObjectId, ref: 'Chemical', required: true, index: true },
    lotId: { type: Schema.Types.ObjectId, ref: 'ChemicalStockLot', required: true, index: true },
    action: {
      type: String,
      enum: ['PURCHASE', 'OPEN', 'CONSUME', 'ADJUSTMENT', 'EXPIRY_DISCARD', 'DELETE'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    remarks: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type ChemicalStockHistory = InferSchemaType<typeof ChemicalStockHistorySchema>;
export type ChemicalStockHistoryModel = Model<ChemicalStockHistory>;
export const ChemicalStockHistoryModel: ChemicalStockHistoryModel =
  (mongoose.models.ChemicalStockHistory as ChemicalStockHistoryModel | undefined) ??
  mongoose.model<ChemicalStockHistory>('ChemicalStockHistory', ChemicalStockHistorySchema);
