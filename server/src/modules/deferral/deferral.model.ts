// Deferral — a donor being held back from donating, temporary or
// permanent. Looked up by the donation eligibility check.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { DEFERRAL_TYPE } from '@/shared/enums';

const DeferralSchema = new Schema(
  {
    donor: { type: Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    type: { type: String, enum: DEFERRAL_TYPE, required: true },
    reason: { type: String, required: true, trim: true },
    // For TEMPORARY: donor eligible again after this date. Null for PERMANENT.
    untilDate: { type: Date, default: null, index: true },
    // Source of the deferral: medical history, vitals, TTI reactive, etc.
    source: {
      type: String,
      enum: ['QUESTIONNAIRE', 'VITALS', 'TTI_REACTIVE', 'LOOKBACK', 'MANUAL'],
      required: true,
    },
    // If raised by a TTI reactive result, link it for lookback.
    relatedDonationId: { type: String, default: null, index: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    liftedAt: { type: Date, default: null },
    liftedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    liftReason: { type: String, trim: true, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

DeferralSchema.index({ donor: 1, type: 1, untilDate: 1 });

export type Deferral = InferSchemaType<typeof DeferralSchema>;
export type DeferralModel = Model<Deferral>;
export const DeferralModel: DeferralModel =
  (mongoose.models.Deferral as DeferralModel | undefined) ??
  mongoose.model<Deferral>('Deferral', DeferralSchema);
