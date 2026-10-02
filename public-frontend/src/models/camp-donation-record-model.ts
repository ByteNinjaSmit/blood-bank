import mongoose, { Schema, Document, Model } from "mongoose";

// Mirrors server/src/modules/donation/camp-donation-record.model.ts —
// same "campdonationrecords" collection. Camp donations (finalized) live
// here, NOT in the "donations" collection. Read-only access from the
// public site (counts only).
export interface ICampDonationRecord extends Document {
  campId?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CampDonationRecordSchema = new Schema<ICampDonationRecord>(
  {
    campId: { type: mongoose.Schema.Types.ObjectId, ref: "Camp", index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "campdonationrecords", strict: false }
);

const CampDonationRecord: Model<ICampDonationRecord> =
  mongoose.models.CampDonationRecord ||
  mongoose.model<ICampDonationRecord>(
    "CampDonationRecord",
    CampDonationRecordSchema
  );

export default CampDonationRecord;
