import mongoose, { Schema, Document } from "mongoose";

export interface IVoluntaryCampDonation extends Document {
    firstName: string;
    middleName?: string;
    lastName: string;
    sex: string;
    dob: Date;
    age: number;
    occupation?: string;
    address: string;
    mobile: string;
    pincode: string;
    email?: string;
    isFirstTime: string;
    isRepeated: string;
    lastDonationDate?: Date;
    totalDonations: number;
    emergencyConsent: string;
    weight: number;
    hb: number;
    temp: number;
    pulse: number;
    bp: string;
    o2Level: number;
    bloodGroup: string;
    pedalOedema: string;
    lymphadenopathy: string;
    cyanosis: string;
    cvs: string;
    rs: string;
    pa: string;
    cns: string;
    gis: string;
    freeFromSkinDisease: string;
    freeFromScars: string;
    siteId: mongoose.Types.ObjectId;
    bagNo?: string;
    segmentNo?: string;
    lotNo?: string;
    typeOfBag?: string;
    status: string;
    createdAt: Date;
}

const VoluntaryCampDonationSchema: Schema<IVoluntaryCampDonation> = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    sex: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    occupation: { type: String },
    address: { type: String, required: true },
    mobile: { type: String, required: true },
    pincode: { type: String, required: true },
    email: { type: String },
    isFirstTime: { type: String, default: "no" },
    isRepeated: { type: String, default: "no" },
    lastDonationDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    emergencyConsent: { type: String, default: "yes" },
    weight: { type: Number, required: true },
    hb: { type: Number, required: true },
    temp: { type: Number, required: true },
    pulse: { type: Number, required: true },
    bp: { type: String, required: true },
    o2Level: { type: Number, required: true },
    bloodGroup: { type: String, required: true },
    pedalOedema: { type: String, default: "no" },
    lymphadenopathy: { type: String, default: "no" },
    cyanosis: { type: String, default: "no" },
    cvs: { type: String, default: "normal" },
    rs: { type: String, default: "normal" },
    pa: { type: String, default: "normal" },
    cns: { type: String, default: "normal" },
    gis: { type: String, default: "normal" },
    freeFromSkinDisease: { type: String, default: "yes" },
    freeFromScars: { type: String, default: "yes" },
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    bagNo: { type: String },
    segmentNo: { type: String },
    lotNo: { type: String },
    typeOfBag: { type: String },
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.VoluntaryCampDonation || mongoose.model<IVoluntaryCampDonation>("VoluntaryCampDonation", VoluntaryCampDonationSchema);
