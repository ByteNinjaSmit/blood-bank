// Donation = the collection event. One per phlebotomy or apheresis run.
// May produce multiple BloodUnits (PRBC + FFP + platelet + cryo).
//
// In-house donations live in the `donations` collection (this model).
// Camp donations (campId set) live in the separate `campdonationrecords`
// collection — see camp-donation-record.model.ts. Both share this exact
// schema shape via buildDonationSchema() so the two collections stay in
// sync structurally; only the target collection differs.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ABO_GROUP, DONATION_TYPE, RH_FACTOR } from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

export function buildDonationSchema() {
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

  const schema = new Schema(
    {
      donationId: { type: String, required: true, unique: true },
      bagNo: { type: String, trim: true },
      segmentNo: { type: String, trim: true },
      lotNo: { type: String, trim: true },
      legacyBagId: { type: Schema.Types.ObjectId, index: true },
      // Nullable — an INWARD (bag-first) donation is created before a
      // donor is identified/linked. STANDARD (donor-first) donations
      // always set this at creation and it stays required in practice
      // for that flow; register() still passes a real donor id.
      donor: { type: Schema.Types.ObjectId, ref: 'Donor', required: false, index: true },
      donationType: { type: String, enum: DONATION_TYPE, required: true },
      collectedAt: { type: Date, required: true, index: true },
      campId: { type: Schema.Types.ObjectId, ref: 'Camp', index: true },
      // Inward Donation feature — bag-first registration workflow.
      // STANDARD is the existing donor-first flow (register()); INWARD is
      // the new bag-first flow (createInward()/linkDonor()/etc).
      registrationMode: { type: String, enum: ['STANDARD', 'INWARD'], default: 'STANDARD' },
      // Tracks how far an INWARD donation has progressed toward being a
      // complete clinical record. Defaults to COMPLETE so every
      // pre-existing donation and every STANDARD-flow donation (which is
      // fully formed at creation) is unaffected by this field's presence.
      completionStatus: {
        type: String,
        enum: ['BAG_ONLY', 'DONOR_PENDING', 'MEDICAL_PENDING', 'COMPLETE'],
        default: 'COMPLETE',
      },
      // Staff-entered ABO/Rh at bag-registration time for an INWARD
      // donation, before TTI/lab confirmation. Mirrors onto the derived
      // BloodUnit(s) as aboGroup/rhFactor with bloodGroupConfirmed=false
      // — see unit.model.ts.
      provisionalBloodGroup: {
        aboGroup: { type: String, enum: ABO_GROUP },
        rhFactor: { type: String, enum: RH_FACTOR },
      },
      phlebotomistId: { type: Schema.Types.ObjectId, ref: 'User' },
      medicalExam: MedicalExamSchema,
      donorFitness: DonorFitnessSchema,
      separation: SeparationSchema,
      // Set while this donation's bag sits in an active (not yet finalized)
      // batch on the Component Separate screen — nothing is actually
      // separated server-side until the batch is signed off, but other
      // screens (donation timeline/details) need a way to show "Under
      // Separation" for that period instead of "Not separated yet".
      separationBatchActive: { type: Boolean, default: false },
      // Set while this donation's bag sits selected in an active (not yet
      // submitted) batch on the Serology TTD Testing screen — same idea as
      // separationBatchActive above, but for the batch-test queue instead
      // of the batch-separate queue.
      ttiBatchActive: { type: Boolean, default: false },
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
      // Set once cascade-delete has reversed the BagStock.issuedQty this
      // donation consumed (via lotNo/typeOfBag) so the bag is returned to
      // inventory. Cleared on restore, which re-consumes the bag. Guards
      // against double-reversal if the cascade is ever re-run.
      bagStockIssueReversed: { type: Boolean, default: false },
      ...cascadeFields,
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true },
  );

  schema.index({ donor: 1, collectedAt: -1 });

  return schema;
}

const DonationSchema = buildDonationSchema();

export type Donation = InferSchemaType<typeof DonationSchema>;
export type DonationModel = Model<Donation>;
export const DonationModel: DonationModel =
  (mongoose.models.Donation as DonationModel | undefined) ??
  mongoose.model<Donation>('Donation', DonationSchema);
