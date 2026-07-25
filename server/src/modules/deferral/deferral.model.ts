// Deferral — a donor being held back from donating, temporary or
// permanent. Looked up by the donation eligibility check.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { DEFERRAL_TYPE } from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

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
      enum: ['QUESTIONNAIRE', 'VITALS', 'TTI_REACTIVE', 'TTI_INDETERMINATE', 'LOOKBACK', 'MANUAL'],
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

    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,
  },
  { timestamps: true },
);

DeferralSchema.index({ donor: 1, type: 1, untilDate: 1 });
// Active-deferral lookup (donor.enrichment.populateLastDonationId): find
// currently-active deferrals for a set of donors.
DeferralSchema.index({ donor: 1, liftedAt: 1 });

export type Deferral = InferSchemaType<typeof DeferralSchema>;
export type DeferralModel = Model<Deferral>;
export const DeferralModel: DeferralModel =
  (mongoose.models.Deferral as DeferralModel | undefined) ??
  mongoose.model<Deferral>('Deferral', DeferralSchema);
