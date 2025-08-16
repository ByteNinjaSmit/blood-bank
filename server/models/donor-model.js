const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const DonorSchema = new Schema({
  donorId: {
    type: String,
    required: true,
    // unique: true // Example: DNR-2025-0001
  },
  name: {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
  },
  uid: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /\d{12}/.test(v); // Example: Basic 12 aadhar card number valid This is Unique Understand
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  dob: {
    type: Date,
    required: true,
  },
  sex: {
    type: String,
    enum: ["M", "F", "O"],
    required: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /\d{10}/.test(v); // Example: Basic 10-digit phone number validation
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    line1: {
      type: String,
      // required: true
    },
    line2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
  },
  occupation: {
    type: String,
  },
  weightKg: {
    type: Number,
    required: true,
  },
  bloodGroup: {
    type: String,
    enum: ["A", "B", "AB", "O"],
    required: true,
  },
  rh: {
    type: String,
    enum: ["Positive", "Negative"],
    required: true,
  },
  donationHistory: [
    {
      donationId: {
        type: Types.ObjectId,
        ref: "Donation",
        // required: true
      },
      date: {
        type: Date,
        // required: true
      },
      bagNo: {
        type: String,
        // required: true
      },
    },
  ],
  eligibilityStatus: {
    type: String,
    enum: ["eligible", "deferred", "temp-deferred"],
    required: true,
  },
  lastDonationDate: {
    type: Date,
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
});

// Auto-update updatedAt before save
DonorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Donor = mongoose.model("Donor", DonorSchema);

module.exports = Donor;
