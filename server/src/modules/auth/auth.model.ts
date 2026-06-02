// Auth persistence: refresh-token rotation chain + short-lived OTP
// sessions for login and registration. User itself is the legacy User
// model (reused via the repository) until users migrate.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

// ---- Refresh tokens (rotation + revocation chain) ----
const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false, index: true },
    revokedAt: { type: Date, default: null },
    replacedByToken: { type: String, default: null },
    createdByIp: { type: String, default: null },
    revokedByIp: { type: String, default: null },
  },
  { timestamps: true },
);
// TTL: drop expired tokens automatically.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshTokenModel: Model<RefreshTokenDoc> =
  (mongoose.models.AuthRefreshToken as Model<RefreshTokenDoc> | undefined) ??
  mongoose.model<RefreshTokenDoc>('AuthRefreshToken', RefreshTokenSchema, 'refreshtokens');

// ---- OTP sessions (login + registration share the shape) ----
const OtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    txnId: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['LOGIN', 'REGISTER'], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastSentAt: { type: Date, default: Date.now },
    // For REGISTER: the pending user payload (password already hashed).
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpDoc = InferSchemaType<typeof OtpSchema>;
export const OtpModel: Model<OtpDoc> =
  (mongoose.models.AuthOtp as Model<OtpDoc> | undefined) ??
  mongoose.model<OtpDoc>('AuthOtp', OtpSchema);
