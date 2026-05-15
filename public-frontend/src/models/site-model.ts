import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISite extends Document {
  siteId: string;
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
  bagsData: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema: Schema<ISite> = new Schema(
  {
    siteId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    contactInfo: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    dateFrom: {
      type: Date,
      required: true,
    },
    dateTo: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ISite, value: Date) {
          return this.dateFrom < value;
        },
        message: "End date must be after start date.",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    donorData: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donor",
      },
    ],
    bagsData: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BloodBag",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Site: Model<ISite> =
  mongoose.models.Site || mongoose.model<ISite>("Site", SiteSchema);

export default Site;
