import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { BAG_TYPE } from '@/shared/enums';

const BagDiscardSchema = new Schema(
  {
    discardId: { type: String, required: true, unique: true },
    discardDate: { type: Date, required: true },
    stockId: { type: Schema.Types.ObjectId, ref: 'BagStock', required: true, index: true },
    bagType: { type: String, enum: BAG_TYPE, required: true },
    batchNumber: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    // Not enum-constrained at the schema level: the PROCUREMENT path
    // validates against BAG_DISCARD_REASON and the CLINICAL empty-bag
    // path (from the /discard screen) against the clinical DISCARD_REASON
    // enum — both enforced by their respective zod validators.
    reason: { type: String, required: true, index: true, trim: true },
    reasonDetail: { type: String, trim: true },
    // Where the discard originated. PROCUREMENT = Bag Discard screen;
    // CLINICAL = an empty/unfilled bag discarded from the clinical
    // /discard screen by segment + batch. Only CLINICAL rows are merged
    // into /api/discard/get-list.
    source: { type: String, enum: ['PROCUREMENT', 'CLINICAL'], default: 'PROCUREMENT', index: true },
    // Segment (empty-bag identity) — only set for CLINICAL rows.
    segmentNo: { type: String, trim: true },
    approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    disposalMethod: { type: String, trim: true },
    biomedicalWasteManifestNo: { type: String, trim: true },
    disposalDate: { type: Date },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

BagDiscardSchema.index({ discardDate: -1 });
BagDiscardSchema.index({ stockId: 1, reason: 1 });

export type BagDiscard = InferSchemaType<typeof BagDiscardSchema>;
export type BagDiscardModel = Model<BagDiscard>;
export const BagDiscardModel: BagDiscardModel =
  (mongoose.models.BagDiscard as BagDiscardModel | undefined) ??
  mongoose.model<BagDiscard>('BagDiscard', BagDiscardSchema);
