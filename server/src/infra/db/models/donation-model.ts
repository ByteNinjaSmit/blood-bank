// Donation = the collection event. One per phlebotomy or apheresis run.
// May produce multiple BloodUnits (PRBC + FFP + platelet + cryo).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { DONATION_TYPE } from '@/shared/enums';

const MedicalExamSchema = new Schema(
  {
    weightKg: Number,
    hbGdl: Number,
    temperatureCelsius: Number,
    pulseBpm: Number,
    bloodPressure: String,
    hasPedalOedema: Boolean,
    oxygenSaturationPercent: Number,
    hasLymphadenopathy: Boolean,
    hasCyanosis: Boolean,
    systemicExamNotes: String,
    skinClearAtPhlebotomy: Boolean,
    armsFreeOfPunctureScars: Boolean,
    volumeMl: Number,
  },
  { _id: false },
);

const DonorFitnessSchema = new Schema(
  {
    isFit: { type: Boolean, required: true },
    rejectionReason: { type: String, trim: true },
    rejectedAtStep: {
      type: String,
      enum: ['QUESTIONNAIRE', 'VITALS', 'COLLECTION', 'POST_DONATION'],
    },
  },
  { _id: false },
);

const DonationSchema = new Schema(
  {
    donationId: { type: String, required: true, unique: true, index: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },
    donor: { type: Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    donationType: { type: String, enum: DONATION_TYPE, required: true },
    collectedAt: { type: Date, required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    phlebotomistId: { type: Schema.Types.ObjectId, ref: 'User' },
    medicalExam: MedicalExamSchema,
    donorFitness: DonorFitnessSchema,
    questionnaireFlags: { type: Map, of: Boolean },
    notes: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

DonationSchema.index({ donor: 1, collectedAt: -1 });

export type Donation = InferSchemaType<typeof DonationSchema>;
export type DonationModel = Model<Donation>;
export const DonationModel: DonationModel =
  (mongoose.models.Donation as DonationModel | undefined) ??
  mongoose.model<Donation>('Donation', DonationSchema);
