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
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
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

// Centrifuge spin log + separation timestamp, captured on the component
// Separate screen. One physical separation event per bag/donation.
const SeparationSchema = new Schema(
  {
    rpmFirstSpin: { type: String, trim: true },
    rpmSecondSpin: { type: String, trim: true },
    separationTime: { type: Date },
  },
  { _id: false },
);

const DonationSchema = new Schema(
  {
    donationId: { type: String, required: true, unique: true },
    bagNo: { type: String, trim: true },
    segmentNo: { type: String, trim: true },
    lotNo: { type: String, trim: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },
    donor: { type: Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    donationType: { type: String, enum: DONATION_TYPE, required: true },
    collectedAt: { type: Date, required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', index: true },
    phlebotomistId: { type: Schema.Types.ObjectId, ref: 'User' },
    medicalExam: MedicalExamSchema,
    donorFitness: DonorFitnessSchema,
    separation: SeparationSchema,
    questionnaireFlags: { type: Map, of: Boolean },
    typeOfBag: { type: String, enum: ['SB', 'DB', 'TB', 'QB'], default: 'SB' },
    notes: { type: String, trim: true },
    // Last correction made to this bag's separated components/spin log
    // after the fact, via the Component List edit screen.
    lastEditReason: { type: String, trim: true },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
