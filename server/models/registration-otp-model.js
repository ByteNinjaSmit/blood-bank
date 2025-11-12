const mongoose = require("mongoose");

const RegistrationOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastSentAt: { type: Date, default: Date.now },
    txnId: { type: String, required: true, unique: true, index: true },
    // Store registration payload safely
    payload: {
      publicId: String,
      firstName: String,
      lastName: String,
      phone: String,
      role: String,
      // Store hashed password, never plaintext
      passwordHash: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
      status: { type: String, default: 'active' },
    }
  },
  { timestamps: true }
);

RegistrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RegistrationOtp", RegistrationOtpSchema);
