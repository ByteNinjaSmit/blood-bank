const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VoluntaryCampDonationSchema = new Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    sex: { type: String, enum: ["M", "F", "Other"], required: true },
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

    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    
    // Additional fields for bag tracking if needed during on-site registration
    bagNo: { type: String },
    segmentNo: { type: String },
    batchNo: { type: String },
    typeOfBag: { type: String },
    
    status: {
        type: String,
        enum: ["Pending", "Donated", "Rejected"],
        default: "Pending"
    },
    
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VoluntaryCampDonation", VoluntaryCampDonationSchema);
