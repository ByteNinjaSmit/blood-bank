import type { AuditAction } from '@/shared/enums';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  module?: string;
  role?: string;
  severity?: 'info' | 'warning' | 'critical';
  before?: unknown;
  after?: unknown;
  changedFields?: string[];
  reason?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditSearchFilters {
  module?: string;
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: string;
  role?: string;
  severity?: string;
  dateFrom?: Date;
  dateTo?: Date;
  q?: string;
}

export interface AuditSearchResult {
  data: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAuditService {
  record(entry: AuditEntry): Promise<void>;
  listForEntity(entityType: string, entityId: string): Promise<unknown[]>;
  search(filters: AuditSearchFilters, page: number, limit: number): Promise<AuditSearchResult>;
  export(filters: AuditSearchFilters, limit?: number): Promise<unknown[]>;
}
