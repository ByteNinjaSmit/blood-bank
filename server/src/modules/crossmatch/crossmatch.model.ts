// Crossmatch — serological compatibility test between a specific donor
// unit and a patient sample. Required for RBC-bearing components.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CrossmatchSchema = new Schema(
  {
    crossmatchId: { type: String, required: true, unique: true },
    requisitionId: { type: Schema.Types.ObjectId, ref: 'Requisition', required: true, index: true },
    unitId: { type: String, required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    method: { type: String, enum: ['IS', 'AHG', 'ELECTRONIC'], required: true },
    phases: {
      immediateSpin: { type: String, enum: ['COMPATIBLE', 'INCOMPATIBLE', 'NA'] },
      coombsAhg: { type: String, enum: ['COMPATIBLE', 'INCOMPATIBLE', 'NA'] },
    },
    result: { type: String, enum: ['COMPATIBLE', 'INCOMPATIBLE'], required: true, index: true },
    // Medical-officer override (issue an incompatible/uncrossmatched unit
    // in an emergency). Must be logged.
    override: {
      isOverride: { type: Boolean, default: false },
      reason: String,
      authorizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Unique crossmatch per unit+requisition pair; fast lookup by patient's
// crossmatch history.
CrossmatchSchema.index({ requisitionId: 1, unitId: 1 });
CrossmatchSchema.index({ patientId: 1, performedAt: -1 });

export type Crossmatch = InferSchemaType<typeof CrossmatchSchema>;
export type CrossmatchModel = Model<Crossmatch>;
export const CrossmatchModel: CrossmatchModel =
  (mongoose.models.Crossmatch as CrossmatchModel | undefined) ??
  mongoose.model<Crossmatch>('Crossmatch', CrossmatchSchema);
