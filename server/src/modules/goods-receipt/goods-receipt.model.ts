import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { BAG_TYPE, ANTICOAGULANT, GRN_STATUS } from '@/shared/enums';

const BatchLineSchema = new Schema(
  {
    bagType: { type: String, enum: BAG_TYPE, required: true },
    capacityMl: { type: Number, required: true },
    anticoagulant: { type: String, enum: ANTICOAGULANT },
    batchNumber: { type: String, required: true, trim: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date, required: true },
    quantityReceived: { type: Number, required: true, min: 1 },
    quantityAccepted: { type: Number, min: 0, default: 0 },
    quantityRejected: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const FinancialsSchema = new Schema(
  {
    basicAmountRs: { type: Number, min: 0 },
    cgstRs: { type: Number, min: 0 },
    sgstRs: { type: Number, min: 0 },
    igstRs: { type: Number, min: 0 },
    discountRs: { type: Number, min: 0 },
    netAmountRs: { type: Number, min: 0 },
  },
  { _id: false },
);

const GoodsReceiptSchema = new Schema(
  {
    grnNumber: { type: String, required: true, unique: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    vendorName: { type: String, trim: true },
    invoiceNo: { type: String, required: true, trim: true },
    billDate: { type: Date, required: true },
    transportDetails: { type: String, trim: true },
    receivedDate: { type: Date, required: true },
    receivedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    batchLines: { type: [BatchLineSchema], required: true },
    financials: { type: FinancialsSchema },
    status: { type: String, enum: GRN_STATUS, default: 'PENDING', index: true },
    notes: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

GoodsReceiptSchema.index({ receivedDate: -1 });
GoodsReceiptSchema.index({ vendorName: 1, status: 1 });

export type GoodsReceipt = InferSchemaType<typeof GoodsReceiptSchema>;
export type GoodsReceiptModel = Model<GoodsReceipt>;
export const GoodsReceiptModel: GoodsReceiptModel =
  (mongoose.models.GoodsReceipt as GoodsReceiptModel | undefined) ??
  mongoose.model<GoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
