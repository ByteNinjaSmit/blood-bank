// AuditLog — append-only record of every clinical mutation. Never
// updated or deleted. Retained per regulation (India: 5 years).

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { AUDIT_ACTION } from '@/shared/enums';

// Well-known sentinel actor used for events that happen before a user
// is authenticated (e.g. a failed login attempt never resolves to a
// User document). Never a real user id.
export const UNAUTHENTICATED_ACTOR_ID = '000000000000000000000000';

const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: AUDIT_ACTION, required: true },
    module: { type: String, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    entityLabel: { type: String },
    role: { type: String },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info', index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    changedFields: { type: [String], default: undefined },
    reason: { type: String },
    requestId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    at: { type: Date, default: Date.now, required: true, index: true },
  },
  { timestamps: false, capped: false },
);

AuditLogSchema.index({ entityType: 1, entityId: 1, at: -1 });
AuditLogSchema.index({ module: 1, at: -1 });
AuditLogSchema.index({ actor: 1, at: -1 });
AuditLogSchema.index({ action: 1, at: -1 });
AuditLogSchema.index({ severity: 1, at: -1 });

export type AuditLog = InferSchemaType<typeof AuditLogSchema>;
export type AuditLogModel = Model<AuditLog>;
export const AuditLogModel: AuditLogModel =
  (mongoose.models.AuditLog as AuditLogModel | undefined) ??
  mongoose.model<AuditLog>('AuditLog', AuditLogSchema);
