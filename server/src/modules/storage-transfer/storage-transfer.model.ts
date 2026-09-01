// StorageTransfer — one record per "Send to Storage" batch. Every item
// always references a real BloodUnit (unlike BulkTransfer's TAKE_LOAN
// items) because a storage dispatch only ever moves bags this bank
// already owns; it never fabricates stock. Deleting a transfer returns
// every item's unit to RELEASED; restoring it re-claims them, but only
// if every one of them is still RELEASED (see storage-transfer.repository.ts).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { COMPONENT_TYPE } from '@/shared/enums';

const StorageTransferItem = new Schema(
  {
    unitId: { type: Schema.Types.ObjectId, ref: 'BloodUnit', required: true },
    bagNo: { type: String, required: true, trim: true },
    componentType: { type: String, enum: COMPONENT_TYPE, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    rhFactor: { type: String, trim: true },
    segmentNo: { type: String, trim: true },
    volumeMl: { type: Number },
    expiresAt: { type: Date },
  },
  { _id: false },
);

const StorageTransferSchema = new Schema(
  {
    transferId: { type: String, required: true, unique: true },
    location: { type: String, required: true, trim: true },
    otherLocationName: { type: String, trim: true },
    sentDate: { type: Date, required: true },
    items: { type: [StorageTransferItem], default: [] },

    deletedAt: { type: Date, default: null, index: true },
    deleteReason: { type: String, default: null, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

StorageTransferSchema.index({ sentDate: -1 });
StorageTransferSchema.index({ createdAt: -1 });

export type StorageTransfer = InferSchemaType<typeof StorageTransferSchema>;
export type StorageTransferModel = Model<StorageTransfer>;
export const StorageTransferModel: StorageTransferModel =
  (mongoose.models.StorageTransfer as StorageTransferModel | undefined) ??
  mongoose.model<StorageTransfer>('StorageTransfer', StorageTransferSchema);
