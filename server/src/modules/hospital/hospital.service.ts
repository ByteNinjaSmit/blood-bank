import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { hospitalRepo, type HospitalDto, type ListHospitalsFilter } from './hospital.repository';

export interface CreateHospitalInput {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email?: string;
  licenseNo?: string;
}
export type UpdateHospitalInput = Partial<CreateHospitalInput>;

const log = childLogger({ module: 'hospital-service' });

export const hospitalService = {
  async create(input: CreateHospitalInput, actorId: string): Promise<HospitalDto> {
    if (await hospitalRepo.findOnePhone(input.phone)) {
      throw new ConflictError('Hospital with this phone number already exists');
    }
    const hospitalId = await hospitalRepo.nextHospitalId();
    const created = await hospitalRepo.create({
      hospitalId,
      name: input.name.trim(),
      address: input.address.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email?.toLowerCase().trim(),
      licenseNo: input.licenseNo?.trim(),
    });
    await auditService.record({
      actorId,
      action: 'CREATE',
      entityType: 'Hospital',
      entityId: created.id,
      after: { name: created.name },
    });
    log.info({ hospitalId: created.id, actorId }, 'hospital created');
    return created;
  },

  async list(filter: ListHospitalsFilter) {
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
  },

  async get(id: string): Promise<HospitalDto> {
    const h = await hospitalRepo.findById(id);
    if (!h) throw new NotFoundError('Hospital', id);
    return h;
  },

  async update(id: string, input: UpdateHospitalInput, actorId: string): Promise<HospitalDto> {
    if (input.phone && (await hospitalRepo.findOnePhone(input.phone, id))) {
      throw new ConflictError('Hospital with this phone number already exists');
    }
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name) patch.name = input.name.trim();
    if (input.address) patch.address = input.address.trim();
    if (input.contactPerson) patch.contactPerson = input.contactPerson.trim();
    if (input.phone) patch.phone = input.phone.trim();
    if (input.email) patch.email = input.email.toLowerCase().trim();
    if (input.licenseNo) patch.licenseNo = input.licenseNo.trim();
    const updated = await hospitalRepo.update(id, patch);
    if (!updated) throw new NotFoundError('Hospital', id);
    await auditService.record({ actorId, action: 'UPDATE', entityType: 'Hospital', entityId: id });
    return updated;
  },

  async remove(id: string, actorId: string): Promise<void> {
    const ok = await hospitalRepo.remove(id);
    if (!ok) throw new NotFoundError('Hospital', id);
    await auditService.record({ actorId, action: 'DELETE', entityType: 'Hospital', entityId: id });
    log.warn({ hospitalId: id, actorId }, 'hospital deleted');
  },
};
