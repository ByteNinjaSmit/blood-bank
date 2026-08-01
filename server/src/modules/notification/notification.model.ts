// InAppNotification — persisted, per-user notification-center entry.
// Distinct from the outbound-email queue in notification.service.ts.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { NOTIFICATION_SEVERITY, NOTIFICATION_MODULE, NOTIFICATION_CATEGORY } from '@/shared/enums';

const InAppNotificationSchema = new Schema(
  {
    // null = broadcast to every active staff user (e.g. stock digest, low-stock alert).
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    module: { type: String, enum: NOTIFICATION_MODULE, required: true, index: true },
    category: { type: String, enum: NOTIFICATION_CATEGORY, required: true, index: true },
    severity: { type: String, enum: NOTIFICATION_SEVERITY, required: true, index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    relatedRecordId: { type: String, default: null },
    relatedRecordType: { type: String, default: null },
    actionLink: { type: String, default: null },
    // Identifies the triggering event for duplicate suppression, e.g.
    // "LOW_STOCK:chemicalId" or "TTI_TESTING_PENDING:donationId:2026-07-13".
    dedupeKey: { type: String, default: null },
  },
  { timestamps: true },
);

InAppNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
// Unique (but sparse via partialFilterExpression) so duplicate-prevention is
// enforced atomically at the DB level instead of via a racy exists-then-create
// check in the service layer. Notifications without a dedupeKey (most of them)
// are excluded from the filter, so unlimited nulls are still allowed.
InAppNotificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } },
);

export type InAppNotification = InferSchemaType<typeof InAppNotificationSchema>;
export type InAppNotificationModel = Model<InAppNotification>;
export const InAppNotificationModel: InAppNotificationModel =
  (mongoose.models.InAppNotification as InAppNotificationModel | undefined) ??
  mongoose.model<InAppNotification>('InAppNotification', InAppNotificationSchema);
