import type { NextFunction, Request, Response } from 'express';
import { ValidateAudit } from './audit.validator';
import { auditService } from './audit.service';
import type { AuditSearchFilters } from '@/shared/interfaces';

interface CommonAuditQuery {
  module?: string;
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: string;
  role?: string;
  severity?: 'info' | 'warning' | 'critical';
  dateFrom?: Date;
  dateTo?: Date;
  q?: string;
}

function toFilters(q: CommonAuditQuery): AuditSearchFilters {
  return {
    module: q.module,
    entityType: q.entityType,
    entityId: q.entityId,
    actor: q.actor,
    action: q.action,
    role: q.role,
    severity: q.severity,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    q: q.q,
  };
}

export const auditController = {
  async listForEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = ValidateAudit.entityTrailParams(req);
      const data = await auditService.listForEntity(entityType, entityId);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ValidateAudit.searchQuery(req);
      const result = await auditService.search(toFilters(q), q.page, q.limit);
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        requestId: req.id,
      });
    } catch (e) {
      next(e);
    }
  },

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ValidateAudit.exportQuery(req);
      const data = await auditService.export(toFilters(q), q.limit);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
};
