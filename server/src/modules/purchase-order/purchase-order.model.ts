import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { BAG_TYPE, BAG_CAPACITY_ML, ANTICOAGULANT, PO_STATUS } from '@/shared/enums';

const LineItemSchema = new Schema(
  {
    bagType: { type: String, enum: BAG_TYPE, required: true },
    capacityMl: { type: Number, enum: BAG_CAPACITY_ML, required: true },
    anticoagulant: { type: String, enum: ANTICOAGULANT, required: true },
    productCode: { type: String, trim: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    unitPriceRs: { type: Number, min: 0 },
    gstPercent: { type: Number, min: 0, max: 100, default: 12 },
  },
  { _id: false },
);

const PurchaseOrderSchema = new Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    poDate: { type: Date, required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    lineItems: { type: [LineItemSchema], required: true },
    totalAmountRs: { type: Number, min: 0 },
    expectedDelivery: { type: Date },
    purchaseOfficerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvalStatus: { type: String, enum: PO_STATUS, default: 'DRAFT', index: true },
    approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    notes: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

PurchaseOrderSchema.index({ poDate: -1 });
PurchaseOrderSchema.index({ vendorId: 1, approvalStatus: 1 });

export type PurchaseOrder = InferSchemaType<typeof PurchaseOrderSchema>;
export type PurchaseOrderModel = Model<PurchaseOrder>;
export const PurchaseOrderModel: PurchaseOrderModel =
  (mongoose.models.PurchaseOrder as PurchaseOrderModel | undefined) ??
  mongoose.model<PurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
