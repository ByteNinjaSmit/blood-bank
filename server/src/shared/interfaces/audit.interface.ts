import type { AuditAction } from '@/shared/enums';

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

export interface IAuditService {
  record(entry: AuditEntry): Promise<void>;
  listForEntity(entityType: string, entityId: string): Promise<unknown[]>;
}
