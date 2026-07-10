import mongoose, { Schema, Document, Model } from "mongoose";

// Mirrors server/src/modules/camp/camp-donation.model.ts exactly — same
// "campdonations" collection, same shape, same model name ("CampDonation").
// The admin panel's Camp Donor Appointment view reads this collection
// directly, so any field drift here silently breaks that view.
export interface ICampDonation extends Document {
    firstName: string;
    middleName?: string;
    lastName: string;
    sex: "M" | "F" | "OTHER";
    dob: Date;
    age: number;
    occupation?: string;
    address: string;
    mobile: string;
    pincode: string;
    email?: string;
    isFirstTime: boolean;
    isRepeated: boolean;
    lastDonationDate?: Date;
    totalDonations: number;
    emergencyConsent: boolean;
    weight: number;
    hb: number;
    temp: number;
    pulse: number;
    bp: string;
    o2Level: number;
    bloodGroup: string;
    clinicalFindings: {
        pedalOedema: boolean;
        lymphadenopathy: boolean;
        cyanosis: boolean;
        cvs: string;
        rs: string;
        pa: string;
        cns: string;
        gis: string;
        freeFromSkinDisease: boolean;
        freeFromScars: boolean;
    };
    campId: mongoose.Types.ObjectId;
    bagNo?: string;
    segmentNo?: string;
    lotNo?: string;
    typeOfBag?: string;
    status: "PENDING" | "DONATED" | "REJECTED";
    createdAt: Date;
    updatedAt: Date;
}

const CampDonationSchema: Schema<ICampDonation> = new Schema(
    {
        firstName: { type: String, required: true, trim: true },
        middleName: { type: String, trim: true },
        lastName: { type: String, required: true, trim: true },
        sex: { type: String, enum: ["M", "F", "OTHER"], required: true },
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
        weight: { type: Number, required: true },
        hb: { type: Number, required: true },
        temp: { type: Number, required: true },
        pulse: { type: Number, required: true },
        bp: { type: String, required: true },
        o2Level: { type: Number, required: true },
        bloodGroup: { type: String, required: true, index: true },
        clinicalFindings: {
            pedalOedema: { type: Boolean, default: false },
            lymphadenopathy: { type: Boolean, default: false },
            cyanosis: { type: Boolean, default: false },
            cvs: { type: String, default: "normal" },
            rs: { type: String, default: "normal" },
            pa: { type: String, default: "normal" },
            cns: { type: String, default: "normal" },
            gis: { type: String, default: "normal" },
            freeFromSkinDisease: { type: Boolean, default: true },
            freeFromScars: { type: Boolean, default: true },
        },
        campId: { type: Schema.Types.ObjectId, ref: "Camp", required: true, index: true },
        bagNo: { type: String, trim: true },
        segmentNo: { type: String, trim: true },
        lotNo: { type: String, trim: true },
        typeOfBag: { type: String, trim: true },
        status: { type: String, enum: ["PENDING", "DONATED", "REJECTED"], default: "PENDING", index: true },
    },
    { timestamps: true, collection: "campdonations" }
);

const CampDonation: Model<ICampDonation> =
    mongoose.models.CampDonation || mongoose.model<ICampDonation>("CampDonation", CampDonationSchema);

export default CampDonation;
