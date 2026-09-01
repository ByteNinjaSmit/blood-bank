// BulkTransfer — records blood bags loaned to, or borrowed from, another
// blood bank as a single batch. Self-contained: it does not touch
// BloodUnit/Donation records — a bulk transfer is a distinct paper trail
// (the physical bags travel with the loan; they are not "our" inventory
// while on loan, and "taken" bags become traceable stock via their own
// entry here, not by fabricating Donation/BloodUnit history that never
// happened at this bank).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { COMPONENT_TYPE } from '@/shared/enums';

const BulkTransferItem = new Schema(
  {
    componentType: { type: String, enum: COMPONENT_TYPE, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    bagNo: { type: String, required: true, trim: true },
    segmentNo: { type: String, trim: true },
    volumeMl: { type: Number },
    collectedAt: { type: Date },
    expiresAt: { type: Date },
    // Only set for GIVE_LOAN items — the BloodUnit this bag came from, so
    // it can be taken out of stock when the loan is given and put back
    // when the transfer is deleted. TAKE_LOAN items never have one; those
    // bags never had a BloodUnit record at this bank.
    unitId: { type: Schema.Types.ObjectId, ref: 'BloodUnit' },
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
    deleteReason: { type: String, default: null, trim: true },
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
