// In-app notification center — persisted per-user/broadcast notifications
// backing the dashboard bell. Separate from notificationService (email
// queue) in notification.service.ts; that one is untouched.

import { childLogger } from '@/core/logger';
import { COMPONENT_TYPE } from '@/shared/enums';
import type { NotificationModule, NotificationCategory, NotificationSeverity } from '@/shared/enums';
import { createNotificationRepo } from './notification.repository';
import type {
  NotificationRepo,
  NotificationDto,
  ListNotificationFilters,
} from './notification.repository';

export interface NotifyInput {
  userId?: string | null;
  title: string;
  message: string;
  module: NotificationModule;
  category: NotificationCategory;
  severity: NotificationSeverity;
  relatedRecordId?: string | null;
  relatedRecordType?: string | null;
  actionLink?: string | null;
  /** When set, suppresses creation if a notification with the same key already exists. */
  dedupeKey?: string | null;
}

export interface NotificationCenterService {
  notify(input: NotifyInput): Promise<NotificationDto | null>;
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
  /** Called opportunistically (e.g. on dashboard load) — no cron involved. */
  checkAndCreateStockSummary(): Promise<void>;
}

const STOCK_SUMMARY_INTERVAL_MS = 2 * 60 * 60 * 1000;

export function createNotificationCenterService(deps: {
  repo: NotificationRepo;
}): NotificationCenterService {
  const log = childLogger({ module: 'notification-center-service' });
  const { repo } = deps;

  return {
    async notify(input) {
      if (input.dedupeKey) {
        const exists = await repo.existsByDedupeKey(input.dedupeKey);
        if (exists) return null;
      }
      const created = await repo.create(input);
      log.info(
        { module: input.module, category: input.category, severity: input.severity },
        'notification created',
      );
      return created;
    },

    list(userId, filters, page, pageSize) {
      return repo.list(userId, filters, page, pageSize);
    },

    unreadCount(userId) {
      return repo.unreadCount(userId);
    },

    markRead(id, userId) {
      return repo.markRead(id, userId);
    },

    markUnread(id, userId) {
      return repo.markUnread(id, userId);
    },

    markAllRead(userId) {
      return repo.markAllRead(userId);
    },

    clearRead(userId) {
      return repo.clearRead(userId);
    },

    remove(id, userId) {
      return repo.remove(id, userId);
    },

    async checkAndCreateStockSummary() {
      const last = await repo.lastByCategory('STOCK_SUMMARY');
      const now = Date.now();
      if (last && now - new Date(last.createdAt).getTime() < STOCK_SUMMARY_INTERVAL_MS) return;

      const counts = await repo.releasedComponentCounts();
      const hash = hashCounts(counts);
      if (last && last.relatedRecordId === hash) return; // no change since last summary

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const lines = COMPONENT_TYPE.map((c) => `${c}: ${counts[c] ?? 0}`).join(', ');

      await repo.create({
        userId: null,
        title: 'Current Blood Stock',
        message: `${lines}, Total Units: ${total}`,
        module: 'INVENTORY',
        category: 'STOCK_SUMMARY',
        severity: 'INFORMATION',
        relatedRecordId: hash,
        relatedRecordType: 'STOCK_SUMMARY_HASH',
      });
      log.info({ counts, total }, 'stock summary notification created');
    },
  };

  function hashCounts(counts: Record<string, number>): string {
    return COMPONENT_TYPE.map((c) => `${c}:${counts[c] ?? 0}`).join('|');
  }
}

// Singleton instance — other modules import this directly to fire
// notify() calls at their own event points, mirroring the existing
// `notificationService` (email) export in notification.service.ts.
export const notificationCenterService: NotificationCenterService = createNotificationCenterService({
  repo: createNotificationRepo(),
});
