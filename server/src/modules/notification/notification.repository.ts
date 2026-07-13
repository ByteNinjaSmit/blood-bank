import { Types } from 'mongoose';
import { InAppNotificationModel } from './notification.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import type {
  NotificationSeverity,
  NotificationModule,
  NotificationCategory,
} from '@/shared/enums';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  module: NotificationModule;
  category: NotificationCategory;
  severity: NotificationSeverity;
  read: boolean;
  readAt: string | null;
  relatedRecordId: string | null;
  relatedRecordType: string | null;
  actionLink: string | null;
  createdAt: string;
}

interface RawNotification {
  _id: { toString(): string };
  title: string;
  message: string;
  module: NotificationModule;
  category: NotificationCategory;
  severity: NotificationSeverity;
  read: boolean;
  readAt: Date | null;
  relatedRecordId: string | null;
  relatedRecordType: string | null;
  actionLink: string | null;
  createdAt: Date;
}

function toDto(n: RawNotification): NotificationDto {
  return {
    id: n._id.toString(),
    title: n.title,
    message: n.message,
    module: n.module,
    category: n.category,
    severity: n.severity,
    read: n.read,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    relatedRecordId: n.relatedRecordId,
    relatedRecordType: n.relatedRecordType,
    actionLink: n.actionLink,
    createdAt: n.createdAt.toISOString(),
  };
}

export interface CreateNotificationInput {
  userId?: string | null;
  title: string;
  message: string;
  module: NotificationModule;
  category: NotificationCategory;
  severity: NotificationSeverity;
  relatedRecordId?: string | null;
  relatedRecordType?: string | null;
  actionLink?: string | null;
  dedupeKey?: string | null;
}

export interface ListNotificationFilters {
  read?: boolean;
  severity?: NotificationSeverity;
  module?: NotificationModule;
}

export interface NotificationRepo {
  create(input: CreateNotificationInput): Promise<NotificationDto>;
  existsByDedupeKey(dedupeKey: string): Promise<boolean>;
  list(
    userId: string,
    filters: ListNotificationFilters,
    page: number,
    pageSize: number,
  ): Promise<{ items: NotificationDto[]; total: number }>;
  unreadCount(userId: string): Promise<number>;
  markRead(id: string, userId: string): Promise<NotificationDto | null>;
  markUnread(id: string, userId: string): Promise<NotificationDto | null>;
  markAllRead(userId: string): Promise<number>;
  clearRead(userId: string): Promise<number>;
  remove(id: string, userId: string): Promise<boolean>;
  lastByCategory(category: NotificationCategory): Promise<NotificationDto | null>;
  releasedComponentCounts(): Promise<Record<string, number>>;
}

function scopeToUser(userId: string) {
  return { $or: [{ userId: new Types.ObjectId(userId) }, { userId: null }] };
}

export function createNotificationRepo(): NotificationRepo {
  return {
    async create(input) {
      const doc = await InAppNotificationModel.create({
        userId: input.userId ? new Types.ObjectId(input.userId) : null,
        title: input.title,
        message: input.message,
        module: input.module,
        category: input.category,
        severity: input.severity,
        relatedRecordId: input.relatedRecordId ?? null,
        relatedRecordType: input.relatedRecordType ?? null,
        actionLink: input.actionLink ?? null,
        dedupeKey: input.dedupeKey ?? null,
      });
      return toDto(doc.toObject() as RawNotification);
    },

    async existsByDedupeKey(dedupeKey) {
      const found = await InAppNotificationModel.exists({ dedupeKey });
      return found !== null;
    },

    async list(userId, filters, page, pageSize) {
      const query: Record<string, unknown> = { ...scopeToUser(userId) };
      if (filters.read !== undefined) query.read = filters.read;
      if (filters.severity) query.severity = filters.severity;
      if (filters.module) query.module = filters.module;

      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        InAppNotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        InAppNotificationModel.countDocuments(query),
      ]);
      return { items: (docs as unknown as RawNotification[]).map(toDto), total };
    },

    async unreadCount(userId) {
      return InAppNotificationModel.countDocuments({ ...scopeToUser(userId), read: false });
    },

    async markRead(id, userId) {
      const doc = await InAppNotificationModel.findOneAndUpdate(
        { _id: id, ...scopeToUser(userId) },
        { $set: { read: true, readAt: new Date() } },
        { new: true },
      ).lean();
      return doc ? toDto(doc as unknown as RawNotification) : null;
    },

    async markUnread(id, userId) {
      const doc = await InAppNotificationModel.findOneAndUpdate(
        { _id: id, ...scopeToUser(userId) },
        { $set: { read: false, readAt: null } },
        { new: true },
      ).lean();
      return doc ? toDto(doc as unknown as RawNotification) : null;
    },

    async markAllRead(userId) {
      const res = await InAppNotificationModel.updateMany(
        { ...scopeToUser(userId), read: false },
        { $set: { read: true, readAt: new Date() } },
      );
      return res.modifiedCount;
    },

    async clearRead(userId) {
      const res = await InAppNotificationModel.deleteMany({ ...scopeToUser(userId), read: true });
      return res.deletedCount ?? 0;
    },

    async remove(id, userId) {
      const res = await InAppNotificationModel.deleteOne({ _id: id, ...scopeToUser(userId) });
      return res.deletedCount === 1;
    },

    async lastByCategory(category) {
      const doc = await InAppNotificationModel.findOne({ category })
        .sort({ createdAt: -1 })
        .lean();
      return doc ? toDto(doc as unknown as RawNotification) : null;
    },

    async releasedComponentCounts() {
      const rows = await BloodUnitModel.aggregate([
        { $match: { status: 'RELEASED', deletedAt: null } },
        { $group: { _id: '$componentType', count: { $sum: 1 } } },
      ]);
      const counts: Record<string, number> = {};
      for (const r of rows as Array<{ _id: string; count: number }>) {
        counts[r._id] = r.count;
      }
      return counts;
    },
  };
}
