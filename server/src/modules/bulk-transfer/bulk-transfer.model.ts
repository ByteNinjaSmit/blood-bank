// BulkTransfer — records blood bags loaned to, or borrowed from, another
// blood bank as a single batch. Self-contained: it does not touch
// BloodUnit/Donation records — a bulk transfer is a distinct paper trail
// (the physical bags travel with the loan; they are not "our" inventory
// while on loan, and "taken" bags become traceable stock via their own
// entry here, not by fabricating Donation/BloodUnit history that never
// happened at this bank).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const BulkTransferItem = new Schema(
  {
    componentType: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    bagNo: { type: String, required: true, trim: true },
    segmentNo: { type: String, trim: true },
    collectedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { _id: false },
);

const BulkTransferSchema = new Schema(
  {
    transferId: { type: String, required: true, unique: true },
    transferType: { type: String, enum: ['GIVE_LOAN', 'TAKE_LOAN'], required: true, index: true },
    bloodBankName: { type: String, required: true, trim: true },
    bloodBankAddress: { type: String, required: true, trim: true },
    transferDate: { type: Date, required: true },
    items: { type: [BulkTransferItem], default: [] },
    notes: { type: String, trim: true },

    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

BulkTransferSchema.index({ transferDate: -1 });
BulkTransferSchema.index({ createdAt: -1 });

export type BulkTransfer = InferSchemaType<typeof BulkTransferSchema>;
export type BulkTransferModel = Model<BulkTransfer>;
export const BulkTransferModel: BulkTransferModel =
  (mongoose.models.BulkTransfer as BulkTransferModel | undefined) ??
  mongoose.model<BulkTransfer>('BulkTransfer', BulkTransferSchema);
