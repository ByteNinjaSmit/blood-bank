import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { BAG_TYPE, BAG_ISSUE_STATUS } from '@/shared/enums';

const BagIssueSchema = new Schema(
  {
    issueNumber: { type: String, required: true, unique: true },
    issueDate: { type: Date, required: true, default: Date.now },
    stockId: { type: Schema.Types.ObjectId, ref: 'BagStock', required: true, index: true },
    bagSerialNumber: { type: String, required: true, unique: true },
    bagType: { type: String, enum: BAG_TYPE, required: true },
    batchNumber: { type: String, required: true, trim: true },
    issuedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collectionRoom: { type: String, trim: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', index: true },
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', index: true },
    status: { type: String, enum: BAG_ISSUE_STATUS, default: 'ISSUED', index: true },
    returnedAt: { type: Date },
    usedAt: { type: Date },
    damagedAt: { type: Date },
    notes: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

BagIssueSchema.index({ issueDate: -1 });
BagIssueSchema.index({ stockId: 1, status: 1 });

export type BagIssue = InferSchemaType<typeof BagIssueSchema>;
export type BagIssueModel = Model<BagIssue>;
export const BagIssueModel: BagIssueModel =
  (mongoose.models.BagIssue as BagIssueModel | undefined) ??
  mongoose.model<BagIssue>('BagIssue', BagIssueSchema);
