import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CAMP_DONATION_STATUS = ['PENDING', 'DONATED', 'REJECTED'] as const;

const CampDonationSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    sex: { type: String, enum: ['M', 'F', 'OTHER'], required: true },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    occupation: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    pincode: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isFirstTime: { type: Boolean, default: false },
    isRepeated: { type: Boolean, default: false },
    lastDonationDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    emergencyConsent: { type: Boolean, default: true },
    bloodGroup: { type: String, required: true, index: true },
    clinicalFindings: {
      pedalOedema: { type: Boolean, default: false },
      lymphadenopathy: { type: Boolean, default: false },
      cyanosis: { type: Boolean, default: false },
      cvs: { type: String, default: 'normal' },
      rs: { type: String, default: 'normal' },
      pa: { type: String, default: 'normal' },
      cns: { type: String, default: 'normal' },
      gis: { type: String, default: 'normal' },
      freeFromSkinDisease: { type: Boolean, default: true },
      freeFromScars: { type: Boolean, default: true },
    },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true, index: true },
    bagNo: { type: String, trim: true },
    segmentNo: { type: String, trim: true },
    lotNo: { type: String, trim: true },
    typeOfBag: { type: String, trim: true },
    status: { type: String, enum: CAMP_DONATION_STATUS, default: 'PENDING', index: true },
  },
  { timestamps: true },
);

CampDonationSchema.index({ campId: 1, status: 1 });
CampDonationSchema.index({ bloodGroup: 1, status: 1 });
CampDonationSchema.index({ createdAt: -1 });

export type CampDonation = InferSchemaType<typeof CampDonationSchema>;
export type CampDonationModelType = Model<CampDonation>;
export const CampDonationModel: CampDonationModelType =
  (mongoose.models.CampDonation as CampDonationModelType | undefined) ??
  mongoose.model<CampDonation>('CampDonation', CampDonationSchema);
