import { auditRepository } from './audit.repository';
import { redactSnapshot } from '@/shared/utils/audit-redaction-map';
import { diffChangedFields } from '@/shared/utils/diff-changed-fields';
import { childLogger } from '@/core/logger';
import type {
  IAuditService,
  AuditEntry,
  AuditSearchFilters,
  AuditSearchResult,
} from '@/shared/interfaces';

export type { AuditEntry, AuditSearchFilters, AuditSearchResult };

const log = childLogger({ module: 'audit-service' });

const MAX_EXPORT_ROWS = 10_000;

export const auditService: IAuditService = {
  // Fire-and-forget: an audit write must never block or fail the
  // caller's business transaction. Failures are logged only.
  async record(entry: AuditEntry): Promise<void> {
    try {
      const before = redactSnapshot(entry.before, entry.entityType);
      const after = redactSnapshot(entry.after, entry.entityType);
      const changedFields = entry.changedFields ?? diffChangedFields(entry.before, entry.after);

      await auditRepository.create({
        ...entry,
        before,
        after,
        changedFields: changedFields.length > 0 ? changedFields : undefined,
      });
    } catch (err) {
      log.error({ err: (err as Error).message, entry }, 'AUDIT WRITE FAILED — investigate');
    }
  },

  async listForEntity(entityType: string, entityId: string): Promise<unknown[]> {
    return auditRepository.findForEntity(entityType, entityId);
  },

  async search(
    filters: AuditSearchFilters,
    page = 1,
    limit = 25,
  ): Promise<AuditSearchResult> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(200, Math.max(1, limit));
    const { data, total } = await auditRepository.findPaginated(filters, safePage, safeLimit);
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },

  async export(filters: AuditSearchFilters, limit = MAX_EXPORT_ROWS): Promise<unknown[]> {
    return auditRepository.findForExport(filters, Math.min(MAX_EXPORT_ROWS, limit));
  },
};
