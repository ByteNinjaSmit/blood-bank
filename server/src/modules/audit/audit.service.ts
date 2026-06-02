import { Types } from 'mongoose';
import { AuditLogModel } from './audit.model';
import { childLogger } from '@/core/logger';
import type { IAuditService, AuditEntry } from '@/shared/interfaces';

export type { AuditEntry };

const log = childLogger({ module: 'audit-service' });

export const auditService: IAuditService = {
  async record(entry: AuditEntry): Promise<void> {
    try {
      await AuditLogModel.create({
        actor: new Types.ObjectId(entry.actorId),
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: entry.before,
        after: entry.after,
        reason: entry.reason,
        requestId: entry.requestId,
        at: new Date(),
      });
    } catch (err) {
      log.error({ err: (err as Error).message, entry }, 'AUDIT WRITE FAILED — investigate');
    }
  },

  async listForEntity(entityType: string, entityId: string): Promise<unknown[]> {
    return AuditLogModel.find({ entityType, entityId }).sort({ at: -1 }).limit(200).lean();
  },
};
