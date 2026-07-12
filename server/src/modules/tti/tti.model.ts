// TTIResult — Transfusion Transmitted Infection panel for one donation.
// Held SEPARATELY from BloodUnit so the "cannot release until TTI
// cleared" gate is a single check (lookup by donationId, inspect
// releaseDecision) regardless of how many units the donation produced.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { TTI_RESULT, TTI_TEST } from '@/shared/enums';

const TestEntry = new Schema(
  {
    testName: { type: String, enum: TTI_TEST, required: true },
    method: { type: String, enum: ['ELISA', 'NAT', 'RAPID', 'CLIA'], required: true },
    result: { type: String, enum: TTI_RESULT, required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, required: true },
    machineId: String,
    kitLot: String,
    notes: String,
  },
  { _id: false },
);

const TtiResultSchema = new Schema(
  {
    donationId: { type: String, required: true, unique: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },

    aboGroupConfirmed: { type: String, enum: ['A', 'B', 'AB', 'O'] },
    rhFactorConfirmed: { type: String, enum: ['POSITIVE', 'NEGATIVE'] },

    tests: { type: [TestEntry], default: [] },

    // Gating field — units of this donation cannot reach RELEASED
    // unless this is 'released'. Counsellor + lookback workflows
    // trigger on 'reactive'.
    releaseDecision: {
      type: String,
      enum: ['pending', 'released', 'reactive', 'indeterminate', 'on-hold'],
      default: 'pending',
      required: true,
      index: true,
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
    decisionNotes: String,

    // Set when a already-finalized result is corrected via the Serology
    // Results edit screen (never on the first entry from the worklist).
    editReason: { type: String, trim: true },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type TtiResult = InferSchemaType<typeof TtiResultSchema>;
export type TtiResultModel = Model<TtiResult>;
export const TtiResultModel: TtiResultModel =
  (mongoose.models.TtiResult as TtiResultModel | undefined) ??
  mongoose.model<TtiResult>('TtiResult', TtiResultSchema);
