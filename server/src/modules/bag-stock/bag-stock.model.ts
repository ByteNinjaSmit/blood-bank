import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { BAG_TYPE, ANTICOAGULANT, BAG_STOCK_STATUS } from '@/shared/enums';

const BagStockSchema = new Schema(
  {
    stockId: { type: String, required: true, unique: true },
    bagType: { type: String, enum: BAG_TYPE, required: true },
    capacityMl: { type: Number, required: true },
    anticoagulant: { type: String, enum: ANTICOAGULANT },
    manufacturer: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true, index: true },
    grnId: { type: Schema.Types.ObjectId, ref: 'GoodsReceipt' },
    openingStock: { type: Number, default: 0, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
    issuedQty: { type: Number, default: 0, min: 0 },
    damagedQty: { type: Number, default: 0, min: 0 },
    discardedQty: { type: Number, default: 0, min: 0 },
    unopenedBoxes: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: BAG_STOCK_STATUS, default: 'AVAILABLE', index: true },
    lastUpdatedAt: { type: Date },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

BagStockSchema.index({ batchNumber: 1, bagType: 1 }, { unique: true });
BagStockSchema.index({ expiryDate: 1 });
BagStockSchema.index({ status: 1 });

export type BagStock = InferSchemaType<typeof BagStockSchema>;
export type BagStockModel = Model<BagStock>;
export const BagStockModel: BagStockModel =
  (mongoose.models.BagStock as BagStockModel | undefined) ??
  mongoose.model<BagStock>('BagStock', BagStockSchema);
