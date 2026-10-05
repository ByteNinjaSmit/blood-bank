import { Types, type FilterQuery } from 'mongoose';
import { AuditLogModel, UNAUTHENTICATED_ACTOR_ID, type AuditLog } from './audit.model';
import type { AuditEntry, AuditSearchFilters } from '@/shared/interfaces';

function buildFilter(filters: AuditSearchFilters): FilterQuery<AuditLog> {
  const q: FilterQuery<AuditLog> = {};
  if (filters.module) q.module = filters.module;
  if (filters.entityType) q.entityType = filters.entityType;
  if (filters.entityId) q.entityId = filters.entityId;
  if (filters.actor && Types.ObjectId.isValid(filters.actor))
    q.actor = new Types.ObjectId(filters.actor);
  if (filters.action) q.action = filters.action;
  if (filters.role) q.role = filters.role;
  if (filters.severity) q.severity = filters.severity;
  if (filters.dateFrom || filters.dateTo) {
    q.at = {};
    if (filters.dateFrom) (q.at as Record<string, Date>).$gte = filters.dateFrom;
    if (filters.dateTo) (q.at as Record<string, Date>).$lte = filters.dateTo;
  }
  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    q.$or = [
      { entityId: rx },
      { entityLabel: rx },
      { 'after.donationId': rx },
      { 'before.donationId': rx },
      { 'after.bagNo': rx },
      { 'before.bagNo': rx },
      { 'after.donor': rx },
      { 'before.donor': rx },
      { 'after.donorId': rx },
      { 'before.donorId': rx },
      { reason: rx },
    ];
  }
  return q;
}

export const auditRepository = {
  async create(entry: AuditEntry & { changedFields?: string[] }): Promise<void> {
    const actor =
      entry.actorId && Types.ObjectId.isValid(entry.actorId)
        ? new Types.ObjectId(entry.actorId)
        : new Types.ObjectId(UNAUTHENTICATED_ACTOR_ID);

    await AuditLogModel.create({
      actor,
      action: entry.action,
      module: entry.module,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel,
      role: entry.role,
      severity: entry.severity ?? 'info',
      before: entry.before,
      after: entry.after,
      changedFields: entry.changedFields,
      reason: entry.reason,
      requestId: entry.requestId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      at: new Date(),
    });
  },

  async findForEntity(entityType: string, entityId: string): Promise<unknown[]> {
    return AuditLogModel.find({ entityType, entityId }).sort({ at: -1 }).limit(200).lean();
  },

  async findPaginated(
    filters: AuditSearchFilters,
    page: number,
    limit: number,
  ): Promise<{ data: unknown[]; total: number }> {
    const query = buildFilter(filters);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AuditLogModel.find(query).sort({ at: -1 }).skip(skip).limit(limit).lean(),
      AuditLogModel.countDocuments(query),
    ]);
    return { data, total };
  },

  async findForExport(filters: AuditSearchFilters, limit: number): Promise<unknown[]> {
    const query = buildFilter(filters);
    return AuditLogModel.find(query).sort({ at: -1 }).limit(limit).lean();
  },
};
