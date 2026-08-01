import mongoose, { Schema, Document, Model } from "mongoose";

// Mirrors server/src/modules/donation/donation.model.ts — same "donations"
// collection. Read-only access from the public site (counts only).
export interface IDonation extends Document {
  donationId: string;
  donor: mongoose.Types.ObjectId;
  donationType: string;
  collectedAt: Date;
  campId?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donationId: { type: String, required: true, unique: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    donationType: { type: String },
    collectedAt: { type: Date, required: true },
    campId: { type: mongoose.Schema.Types.ObjectId, ref: "Camp" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "donations" }
);

const Donation: Model<IDonation> =
  mongoose.models.Donation || mongoose.model<IDonation>("Donation", DonationSchema);

export default Donation;
