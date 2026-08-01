import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CampSchema = new Schema(
  {
    campId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    contactInfo: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    dateFrom: { type: Date, required: true, index: true },
    dateTo: {
      type: Date,
      required: true,
      validate: {
        validator(this: { dateFrom: Date }, v: Date) {
          return this.dateFrom < v;
        },
        message: 'End date must be after start date.',
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // Staff assigned to run this camp (refs validated to max 50 at app layer).
    staff: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // Donors registered at this camp.
    donorData: [{ type: Schema.Types.ObjectId, ref: 'Donor' }],
    // Blood units collected at this camp (refs BloodUnit, not legacy BloodBag).
    unitData: [{ type: Schema.Types.ObjectId, ref: 'BloodUnit' }],
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

CampSchema.index({ dateFrom: 1, dateTo: 1 });
CampSchema.index({ createdAt: -1 });

export type Camp = InferSchemaType<typeof CampSchema>;
export type CampModelType = Model<Camp>;
export const CampModel: CampModelType =
  (mongoose.models.Camp as CampModelType | undefined) ?? mongoose.model<Camp>('Camp', CampSchema);
