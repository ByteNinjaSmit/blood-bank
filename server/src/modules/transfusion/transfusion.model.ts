import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { TRANSFUSION_OUTCOME } from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

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

    bedsideCheck: {
      checkedById: { type: Schema.Types.ObjectId, ref: 'User' },
      witnessedById: { type: Schema.Types.ObjectId, ref: 'User' },
      patientIdConfirmed: { type: Boolean, default: false },
      unitIdConfirmed: { type: Boolean, default: false },
      compatibilityConfirmed: { type: Boolean, default: false },
    },

    startedAt: { type: Date, index: true },
    endedAt: Date,
    vitalsLog: { type: [VitalsEntry], default: [] },
    outcome: { type: String, enum: TRANSFUSION_OUTCOME, index: true },
    hadReaction: { type: Boolean, default: false, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,
  },
  { timestamps: true },
);

// Patient transfusion history.
TransfusionSchema.index({ patientId: 1, startedAt: -1 });
// Haemovigilance: all reactions or abnormal outcomes.
TransfusionSchema.index({ hadReaction: 1, outcome: 1 });
TransfusionSchema.index({ createdAt: -1 });

export type Transfusion = InferSchemaType<typeof TransfusionSchema>;
export type TransfusionModel = Model<Transfusion>;
export const TransfusionModel: TransfusionModel =
  (mongoose.models.Transfusion as TransfusionModel | undefined) ??
  mongoose.model<Transfusion>('Transfusion', TransfusionSchema);
