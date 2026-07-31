// DonorCard — records a donor card brought in exchange for blood at
// requisition time (a family member donating/having donated in
// exchange for the patient receiving units). Tracked per-requisition
// so the dashboard/monthly report can aggregate what was ultimately
// issued against it.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const DonorCardSchema = new Schema(
  {
    requisitionId: { type: Schema.Types.ObjectId, ref: 'Requisition', required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    donationCardNumber: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

DonorCardSchema.index({ createdAt: -1 });

export type DonorCard = InferSchemaType<typeof DonorCardSchema>;
export type DonorCardModel = Model<DonorCard>;
export const DonorCardModel: DonorCardModel =
  (mongoose.models.DonorCard as DonorCardModel | undefined) ??
  mongoose.model<DonorCard>('DonorCard', DonorCardSchema);
