// AdverseReaction — haemovigilance record for a transfusion reaction.
// Reported to the national programme (India: HvPI).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ADVERSE_REACTION_CATEGORY, ADVERSE_REACTION_SEVERITY } from '@/shared/enums';

const AdverseReactionSchema = new Schema(
  {
    reactionId: { type: String, required: true, unique: true },
    transfusionId: { type: Schema.Types.ObjectId, ref: 'Transfusion', required: true, index: true },
    unitId: { type: String, required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    category: { type: String, enum: ADVERSE_REACTION_CATEGORY, required: true },
    severity: { type: String, enum: ADVERSE_REACTION_SEVERITY, required: true },
    onsetMinutesAfterStart: Number,
    signsSymptoms: [String],
    investigationsDone: [String],
    managementGiven: String,
    outcome: String,
    reportedToHvPI: { type: Boolean, default: false },
    reportedAt: Date,
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type AdverseReaction = InferSchemaType<typeof AdverseReactionSchema>;
export type AdverseReactionModel = Model<AdverseReaction>;
export const AdverseReactionModel: AdverseReactionModel =
  (mongoose.models.AdverseReaction as AdverseReactionModel | undefined) ??
  mongoose.model<AdverseReaction>('AdverseReaction', AdverseReactionSchema);
