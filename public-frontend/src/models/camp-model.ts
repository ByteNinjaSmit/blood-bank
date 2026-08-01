import mongoose, { Schema, Document, Model } from "mongoose";

// Mirrors server/src/modules/camp/camp.model.ts — same "camps" collection,
// read-only access from the public site (no writes happen here).
export interface ICamp extends Document {
  campId: string;
  name: string;
  description?: string;
  address: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  dateFrom: Date;
  dateTo: Date;
  createdBy: mongoose.Types.ObjectId;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  staff: mongoose.Types.ObjectId[];
  donorData: mongoose.Types.ObjectId[];
  unitData: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CampSchema = new Schema<ICamp>(
  {
    campId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    contactInfo: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    donorData: [{ type: mongoose.Schema.Types.ObjectId, ref: "Donor" }],
    unitData: [{ type: mongoose.Schema.Types.ObjectId, ref: "BloodUnit" }],
  },
  { timestamps: true, collection: "camps" }
);

const Camp: Model<ICamp> =
  mongoose.models.Camp || mongoose.model<ICamp>("Camp", CampSchema);

export default Camp;
