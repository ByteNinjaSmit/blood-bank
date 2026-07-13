// Thin helper used inside service factories to cut the boilerplate of
// calling auditService.record() at every mutation commit point.
// Services stay Express-free (hard rule) — callers thread a small
// AuditContext down from the controller instead of passing `req`.

import { auditService } from '@/modules/audit/audit.service';
import type { AuditAction } from '@/shared/enums';

export interface AuditContext {
  actorId: string;
  role?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditMeta {
  module: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  severity?: 'info' | 'warning' | 'critical';
  reason?: string;
}

/**
 * Fire-and-forget audit write for a single mutation. `before`/`after`
 * are passed through as-is — redaction and changedFields diffing
 * happen centrally inside auditService.record().
 */
export function withAudit(
  ctx: AuditContext,
  meta: AuditMeta,
  before?: unknown,
  after?: unknown,
): Promise<void> {
  return auditService.record({
    actorId: ctx.actorId,
    role: ctx.role,
    requestId: ctx.requestId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    module: meta.module,
    action: meta.action,
    entityType: meta.entityType,
    entityId: meta.entityId,
    entityLabel: meta.entityLabel,
    severity: meta.severity,
    reason: meta.reason,
    before,
    after,
  });
}
