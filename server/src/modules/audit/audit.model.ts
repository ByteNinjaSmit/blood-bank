// AuditLog — append-only record of every clinical mutation. Never
// updated or deleted. Retained per regulation (India: 5 years).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { AUDIT_ACTION } from '@/shared/enums';

const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: AUDIT_ACTION, required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String },
    requestId: { type: String },
    at: { type: Date, default: Date.now, required: true, index: true },
  },
  { timestamps: false, capped: false },
);

AuditLogSchema.index({ entityType: 1, entityId: 1, at: -1 });

export type AuditLog = InferSchemaType<typeof AuditLogSchema>;
export type AuditLogModel = Model<AuditLog>;
export const AuditLogModel: AuditLogModel =
  (mongoose.models.AuditLog as AuditLogModel | undefined) ??
  mongoose.model<AuditLog>('AuditLog', AuditLogSchema);
