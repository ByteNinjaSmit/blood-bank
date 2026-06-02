// Patient — transfusion recipient. ABO/Rh requires two independent
// determinations before electronic crossmatch (two-record rule).
// Antibody history is sticky (antigen-negative units forever). Special
// needs are hard requirements.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ABO_GROUP, RH_FACTOR, SPECIAL_NEED } from '@/shared/enums';

const GroupConfirmation = new Schema(
  {
    aboGroup: { type: String, enum: ABO_GROUP, required: true },
    rhFactor: { type: String, enum: RH_FACTOR, required: true },
    sampleId: String,
    determinedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    determinedAt: { type: Date, required: true },
  },
  { _id: false },
);

const AntibodyEntry = new Schema(
  {
    antibody: { type: String, required: true }, // e.g. anti-K, anti-E
    identifiedAt: { type: Date, required: true },
    source: { type: String }, // screen, panel, history
  },
  { _id: false },
);

const PatientSchema = new Schema(
  {
    patientPublicId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    dob: Date,
    sex: { type: String, enum: ['M', 'F', 'O'] },
    medicalRecordNumber: { type: String, index: true },

    aboGroup: { type: String, enum: ABO_GROUP },
    rhFactor: { type: String, enum: RH_FACTOR },
    // Two independent determinations needed for electronic crossmatch.
    groupConfirmations: { type: [GroupConfirmation], default: [] },

    antibodyHistory: { type: [AntibodyEntry], default: [] },
    specialNeeds: [{ type: String, enum: SPECIAL_NEED }],

    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type Patient = InferSchemaType<typeof PatientSchema>;
export type PatientModel = Model<Patient>;
export const PatientModel: PatientModel =
  (mongoose.models.Patient as PatientModel | undefined) ??
  mongoose.model<Patient>('Patient', PatientSchema);
