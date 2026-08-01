import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ABO_GROUP, RH_FACTOR, DONOR_LAST_DONATION_PLACE } from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

const AddressSchema = new Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false },
);

const DonorSchema = new Schema(
  {
    donorId: { type: String, required: true, unique: true, index: true },
    name: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true },
      lastName: { type: String, required: true, trim: true },
    },
    uid: { type: String, trim: true, index: true },
    dob: { type: Date, required: true },
    sex: { type: String, enum: ['M', 'F', 'O'], required: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    address: { type: AddressSchema, required: true },
    occupation: { type: String, trim: true },
    weightKg: { type: Number, required: true },
    bloodGroup: { type: String, enum: ABO_GROUP, required: true, index: true },
    rh: { type: String, enum: RH_FACTOR, required: true, index: true },
    eligibilityStatus: {
      type: String,
      enum: ['eligible', 'deferred', 'temp-deferred'],
      default: 'eligible',
      index: true,
    },
    lastDonationDate: { type: Date, index: true },
    // Where the last donation (as entered above) was performed — only
    // meaningful alongside lastDonationDate; defaults to in-house since
    // that's the common case (most donors last donated at this bank).
    lastDonationPlace: {
      type: String,
      enum: DONOR_LAST_DONATION_PLACE,
      default: 'SANJIVANI_BLOOD_BANK',
    },
    // Donor's answer to "Will you donate if we call in emergency?" (Yes/No).
    emergencyDonationWillingness: { type: String, enum: ['Yes', 'No', ''], default: '' },
    // 768-dim dense vector for Atlas Vector Search (populated by embedding job).
    // select:false keeps it out of normal queries; sparse avoids wasted index space.
    embedding: { type: [Number], default: null, select: false },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

DonorSchema.index({ bloodGroup: 1, rh: 1, eligibilityStatus: 1 });
DonorSchema.index({
  'name.firstName': 'text',
  'name.lastName': 'text',
  phone: 'text',
  donorId: 'text',
});

export type Donor = InferSchemaType<typeof DonorSchema>;
export type DonorModelType = Model<Donor>;
export const DonorModel: DonorModelType =
  (mongoose.models.Donor as DonorModelType | undefined) ??
  mongoose.model<Donor>('Donor', DonorSchema);
