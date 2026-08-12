import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import {
  cascadeSoftDelete,
  cascadeRestore,
  runInCascadeTransaction,
  newDeleteBatchId,
} from '@/shared/utils/cascade-delete';
import { hospitalCascadeNode } from '@/shared/cascade-registry';
import { hospitalRepo, type HospitalDto, type ListHospitalsFilter } from './hospital.repository';

export interface CreateHospitalInput {
  name: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  licenseNo?: string;
}
export type UpdateHospitalInput = Partial<CreateHospitalInput>;

const log = childLogger({ module: 'hospital-service' });

const HOSPITAL_ALL_KEY = 'hospital:all';
const HOSPITAL_TTL = 300; // 5 min — master data changes rarely
const hospitalKey = (id: string) => `hospital:detail:${id}`;

export const hospitalService = {
  async create(input: CreateHospitalInput, actorId: string): Promise<HospitalDto> {
    if (input.phone && (await hospitalRepo.findOnePhone(input.phone))) {
      throw new ConflictError('Hospital with this phone number already exists');
    }
    const hospitalId = await hospitalRepo.nextHospitalId();
    const created = await hospitalRepo.create({
      hospitalId,
      name: input.name.trim(),
      address: input.address?.trim(),
      contactPerson: input.contactPerson?.trim(),
      phone: input.phone?.trim(),
      email: input.email?.toLowerCase().trim(),
      licenseNo: input.licenseNo?.trim(),
    });
    await auditService.record({
      actorId,
      module: 'hospital',
      action: 'CREATE',
      entityType: 'Hospital',
      entityId: created.id,
      entityLabel: created.name,
      after: { hospitalId: created.hospitalId, name: created.name, phone: created.phone },
    });
    await invalidate('hospital:*');
    log.info({ hospitalId: created.id, actorId }, 'hospital created');
    return created;
  },

  async list(filter: ListHospitalsFilter) {
    // Only cache the default first-page unfiltered view (the catalogue lookup).
    const isSimpleList =
      !filter.name && !filter.contactPerson && !filter.phone && filter.page === 1;
    const key = isSimpleList ? HOSPITAL_ALL_KEY : null;

    const fetch = async () => {
      const { items, total } = await hospitalRepo.list(filter);
      const totalPages = Math.ceil(total / filter.limit);
      return {
        items,
        pagination: {
          currentPage: filter.page,
          totalPages,
          totalCount: total,
          pageSize: filter.limit,
          hasNextPage: filter.page < totalPages,
          hasPrevPage: filter.page > 1,
        },
      };
    };

    return key ? cached(key, HOSPITAL_TTL, fetch) : fetch();
  },

  async get(id: string): Promise<HospitalDto> {
    const h = await cached(hospitalKey(id), HOSPITAL_TTL, () => hospitalRepo.findById(id));
    if (!h) throw new NotFoundError('Hospital', id);
    return h;
  },

  async update(
    id: string,
    input: UpdateHospitalInput,
    actorId: string,
    editReason?: string,
  ): Promise<HospitalDto> {
    if (input.phone && (await hospitalRepo.findOnePhone(input.phone, id))) {
      throw new ConflictError('Hospital with this phone number already exists');
    }
    const before = await hospitalRepo.findById(id);
    if (!before) throw new NotFoundError('Hospital', id);
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name) patch.name = input.name.trim();
    if (input.address) patch.address = input.address.trim();
    if (input.contactPerson) patch.contactPerson = input.contactPerson.trim();
    if (input.phone) patch.phone = input.phone.trim();
    if (input.email) patch.email = input.email.toLowerCase().trim();
    if (input.licenseNo) patch.licenseNo = input.licenseNo.trim();
    const updated = await hospitalRepo.update(id, patch);
    if (!updated) throw new NotFoundError('Hospital', id);
    await auditService.record({
      actorId,
      module: 'hospital',
      action: 'UPDATE',
      entityType: 'Hospital',
      entityId: id,
      entityLabel: updated.name,
      before,
      after: updated,
      reason: editReason,
    });
    await invalidate('hospital:*');
    return updated;
  },

  async remove(id: string, actorId: string, reason: string): Promise<void> {
    const before = await hospitalRepo.findById(id);
    if (!before) throw new NotFoundError('Hospital', id);
    const deleteBatchId = newDeleteBatchId();
    await runInCascadeTransaction((session) =>
      cascadeSoftDelete(hospitalCascadeNode, id, actorId, reason, deleteBatchId, session),
    );
    await auditService.record({
      actorId,
      module: 'hospital',
      action: 'DELETE',
      entityType: 'Hospital',
      entityId: id,
      entityLabel: before.name,
      severity: 'warning',
      before,
      after: { deletedAt: new Date() },
      reason,
    });
    await invalidate('hospital:*');
    log.warn({ hospitalId: id, actorId, deleteBatchId }, 'hospital cascade soft-deleted');
  },

  async restore(id: string, actorId: string): Promise<{ restored: boolean }> {
    const before = await hospitalRepo.findByIdIncludingDeleted(id);
    if (!before) throw new NotFoundError('Hospital', id);
    await runInCascadeTransaction((session) =>
      cascadeRestore(hospitalCascadeNode, id, actorId, session),
    );
    await auditService.record({
      actorId,
      module: 'hospital',
      action: 'UPDATE',
      entityType: 'Hospital',
      entityId: id,
      entityLabel: before.name,
      before: { deletedAt: (before as any).deletedAt },
      after: { deletedAt: null },
    });
    await invalidate('hospital:*');
    log.warn({ hospitalId: id, actorId }, 'hospital cascade restored');
    return { restored: true };
  },

  async permanentDelete(id: string, actorId: string, reason: string): Promise<void> {
    const before = await hospitalRepo.findByIdIncludingDeleted(id);
    if (!before) throw new NotFoundError('Hospital', id);
    const ok = await hospitalRepo.remove(id);
    if (!ok) throw new NotFoundError('Hospital', id);
    await auditService.record({
      actorId,
      module: 'hospital',
      action: 'DELETE',
      entityType: 'Hospital',
      entityId: id,
      entityLabel: before.name,
      severity: 'critical',
      before,
      reason,
    });
    await invalidate('hospital:*');
    log.warn({ hospitalId: id, actorId }, 'hospital permanently deleted');
  },
};
