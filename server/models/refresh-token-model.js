const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const RefreshTokenSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, index: true, unique: true },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false, index: true },
  revokedAt: { type: Date, default: null },
  replacedByToken: { type: String, default: null },
  createdByIp: { type: String, default: null },
  revokedByIp: { type: String, default: null },
}, { timestamps: true });

RefreshTokenSchema.methods.isExpired = function() {
  return Date.now() >= new Date(this.expiresAt).getTime();
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
