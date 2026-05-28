const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const BloodBagSchema = new Schema({
  bagNo: {
    type: String,
    required: true,
    trim: true,
  },
  segmentNo: {
    type: String,
    required: true,
    trim: true,
  },
  lotNo: {
    type: String,
    trim: true,
  },
  typeOfBag: {
    type: String,
    enum: ["DB", "TB", "QB"],
    required: true,
  },

  // ----- NEW: Donation type & history fields -----
  donationType: {
    type: String,
    enum: ["first_time", "repeated", "last_donation"],
  },
  totalDonationCount: {
    type: Number,
  },
  emergencyDonationWillingness: {
    type: String,
    enum: ["Yes", "No"],
  },

  donor: {
    type: Types.ObjectId,
    ref: "Donor",
    required: true,
  },
  collectionDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
  },

  // ----- MEDICAL EXAMINATION DETAILS (replaces old initialVitals) -----
  medicalExamination: {
    weightKg: { type: Number },
    hb: { type: Number },
    tempC: { type: Number },
    pulse: { type: Number },
    bp: { type: String, trim: true },
    pedalOedema: { type: String, enum: ["Yes", "No"] },
    o2Level: { type: Number },
    lymphadenopathy: { type: String, enum: ["Yes", "No"] },
    cyanosis: { type: String, enum: ["Yes", "No"] },
    systematicExam: { type: String, trim: true },
    skinDiseaseFreeAtPhlebotomy: { type: String, enum: ["Yes", "No"] },
    armsFreeFromPunctureScars: { type: String, enum: ["Yes", "No"] },
    volumeGmMl: { type: Number },
  },

  // Keep old field name as alias so existing data doesn't break reads
  initialVitals: {
    hb: { type: Number },
    weightKg: { type: Number },
    pulse: { type: Number },
    tempC: { type: Number },
    bp: { type: String },
  },

  // ----- BLOOD COLLECTION CHECKLIST -----
  bloodCollection: {
    emptyBagExamined: { type: Boolean, default: false },
    collectedWithin6to8Min: { type: Boolean, default: false },
    crossCheckingDone: { type: Boolean, default: false },
  },

  // ----- DONOR FITNESS -----
  donorFitness: {
    isFit: { type: Boolean },
    rejectionReason: { type: String, trim: true },
  },

  // ----- MEDICAL QUESTIONS (q1 – q36) -----
  medicalQuestions: {
    q1: { type: String, enum: ["Yes", "No"] },
    q2: { type: String, enum: ["Yes", "No"] },
    q3: { type: String, enum: ["Yes", "No"] },
    q4: { type: String, enum: ["Yes", "No"] },
    q5: { type: String, enum: ["Yes", "No"] },
    q6: { type: String, enum: ["Yes", "No"] },
    q7: { type: String, enum: ["Yes", "No"] },
    q8: { type: String, enum: ["Yes", "No"] },
    q9: { type: String, enum: ["Yes", "No"] },
    q10: { type: String, enum: ["Yes", "No"] },
    q11: { type: String, enum: ["Yes", "No"] },
    q12: { type: String, enum: ["Yes", "No"] },
    q13: { type: String, enum: ["Yes", "No"] },
    q14: { type: String, enum: ["Yes", "No"] },
    q15: { type: String, enum: ["Yes", "No"] },
    q16: { type: String, enum: ["Yes", "No"] },
    q17: { type: String, enum: ["Yes", "No"] },
    q18: { type: String, enum: ["Yes", "No"] },
    q19: { type: String, enum: ["Yes", "No"] },
    q20: { type: String, enum: ["Yes", "No"] },
    q21: { type: String, enum: ["Yes", "No"] },
    q22: { type: String, enum: ["Yes", "No"] },
    q23: { type: String, enum: ["Yes", "No"] },
    q24: { type: String, enum: ["Yes", "No"] },
    q25: { type: String, enum: ["Yes", "No"] },
    q26: { type: String, enum: ["Yes", "No"] },
    q27: { type: String, enum: ["Yes", "No"] },
    q28: { type: String, enum: ["Yes", "No"] },
    q29: { type: String, enum: ["Yes", "No"] },
    q30: { type: String, enum: ["Yes", "No"] },
    q31: { type: String, enum: ["Yes", "No"] },
    q32: { type: String, enum: ["Yes", "No"] },
    q33: { type: String, enum: ["Yes", "No"] },
    q34: { type: String, enum: ["Yes", "No"] },
    q35: { type: String, enum: ["Yes", "No"] },
    q36: { type: String, enum: ["Yes", "No"] },
  },

  bloodGroup: {
    type: String,
    enum: ["A", "B", "AB", "O", "Unknown"],
    required: true,
  },
  rh: {
    type: String,
    enum: ["Positive", "Negative", "Unknown"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "collected",
      "component-separated",
      "testing",
      "passed",
      "failed",
      "quarantined",
      "issued",
      "discarded",
    ],
    required: true,
  },
  quarantineReason: {
    type: String,
    trim: true,
  },
  components: [
    {
      type: Types.ObjectId,
      ref: "Component",
    },
  ],
  componentSeparationComplete: {
    type: Boolean,
    default: false,
  },
  separationVerifiedBy: {
    type: Types.ObjectId,
    ref: "User",
  },
  separationVerifiedSignature: {
    type: String,
    trim: true,
  },
  separationVerifiedAt: {
    type: Date,
  },
  siteId: {
    type: Types.ObjectId,
    ref: "Site",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  testResults: [
    {
      test: {
        type: String,
        enum: ["HIV", "HBsAg", "HCV", "VDRL", "MP"],
      },
      result: {
        type: String,
        enum: ["Reactive", "Negative", "Shadeness"],
      },
      testedAt: {
        type: Date,
      },
      technicianId: {
        type: Types.ObjectId,
        ref: "User",
      },
    },
  ],
  crossMatched: { type: Boolean, default: false },
  crossMatchedFor: { type: Types.ObjectId, ref: "HospitalRequest" },
});

// Auto-update updatedAt before save
BloodBagSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const BloodBag = mongoose.model("BloodBag", BloodBagSchema);

module.exports = BloodBag;
