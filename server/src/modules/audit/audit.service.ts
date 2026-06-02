// Audit service. Fire-and-forget append. Services call record(...) after
// a clinical mutation. Failures are logged but never block the request
// (the mutation already happened; losing an audit line is logged loud).

import { Types } from 'mongoose';
import { AuditLogModel } from './audit.model';
import { childLogger } from '@/core/logger';
import type { AuditAction } from '@/shared/enums';

const log = childLogger({ module: 'audit-service' });

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  requestId?: string;
}

export const auditService = {
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
      // Audit must be durable, but must not break the clinical action.
      log.error(
        { err: (err as Error).message, entry },
        'AUDIT WRITE FAILED — investigate',
      );
    }
  },

  async listForEntity(entityType: string, entityId: string) {
    return AuditLogModel.find({ entityType, entityId }).sort({ at: -1 }).limit(200).lean();
  },
};
