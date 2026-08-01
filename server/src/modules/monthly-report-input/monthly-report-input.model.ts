// MonthlyReportInput — the one persisted exception in the otherwise
// read-only monthly-report module. Holds figures a human has to type
// in (Donor Counselling Before Donation, ICTC Referral test counts)
// since nothing in the clinical data model tracks them.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const IctcReferralSchema = new Schema(
  {
    hiv: { type: Number, default: 0, min: 0 },
    hbsag: { type: Number, default: 0, min: 0 },
    hcv: { type: Number, default: 0, min: 0 },
    vdrl: { type: Number, default: 0, min: 0 },
    malaria: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const MonthlyReportInputSchema = new Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    donorCounsellingCount: { type: Number, default: 0, min: 0 },
    ictcReferral: { type: IctcReferralSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

MonthlyReportInputSchema.index({ month: 1, year: 1 }, { unique: true });

export type MonthlyReportInput = InferSchemaType<typeof MonthlyReportInputSchema>;
export type MonthlyReportInputModel = Model<MonthlyReportInput>;
export const MonthlyReportInputModel: MonthlyReportInputModel =
  (mongoose.models.MonthlyReportInput as MonthlyReportInputModel | undefined) ??
  mongoose.model<MonthlyReportInput>('MonthlyReportInput', MonthlyReportInputSchema);
