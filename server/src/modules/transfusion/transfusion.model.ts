// Transfusion — confirmed administration of an issued unit at the
// bedside. Closes the unit lifecycle (ISSUED -> TRANSFUSED).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { TRANSFUSION_OUTCOME } from '@/shared/enums';

const VitalsEntry = new Schema(
  {
    at: { type: Date, required: true },
    temperatureCelsius: Number,
    pulseBpm: Number,
    bloodPressure: String,
    respiratoryRate: Number,
    notes: String,
  },
  { _id: false },
);

const TransfusionSchema = new Schema(
  {
    transfusionId: { type: String, required: true, unique: true },
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    unitId: { type: String, required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },

    // Two-person bedside check (mandatory before starting).
    bedsideCheck: {
      checkedById: { type: Schema.Types.ObjectId, ref: 'User' },
      witnessedById: { type: Schema.Types.ObjectId, ref: 'User' },
      patientIdConfirmed: { type: Boolean, default: false },
      unitIdConfirmed: { type: Boolean, default: false },
      compatibilityConfirmed: { type: Boolean, default: false },
    },

    startedAt: Date,
    endedAt: Date,
    vitalsLog: { type: [VitalsEntry], default: [] },
    outcome: { type: String, enum: TRANSFUSION_OUTCOME },
    hadReaction: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type Transfusion = InferSchemaType<typeof TransfusionSchema>;
export type TransfusionModel = Model<Transfusion>;
export const TransfusionModel: TransfusionModel =
  (mongoose.models.Transfusion as TransfusionModel | undefined) ??
  mongoose.model<Transfusion>('Transfusion', TransfusionSchema);
