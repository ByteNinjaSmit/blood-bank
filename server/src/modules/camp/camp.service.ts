import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { campRepo, type VoluntaryFilter } from './camp.repository';

export interface CreateCampInput {
  campId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  staff: string[];
  dateFrom: Date;
  dateTo: Date;
}
export interface UpdateCampInput {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  staff?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

const log = childLogger({ module: 'camp-service' });

const CAMP_LIST_KEY = 'camp:list';
const CAMP_LIST_TTL = 60;

export const campService = {
  async create(input: CreateCampInput, actorId: string) {
    if (input.dateTo < input.dateFrom) {
      throw new ConflictError('End date cannot be earlier than start date');
    }
    const camp = await campRepo.create({
      campId: input.campId,
      name: input.name,
      description: input.description,
      address: input.address,
      contactInfo: { phone: input.phone, email: input.email },
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      createdBy: actorId,
      lastUpdatedBy: actorId,
      staff: input.staff,
    });
    await auditService.record({
      actorId,
      action: 'CREATE',
      entityType: 'Camp',
      entityId: String(camp._id),
    });
    await invalidate(CAMP_LIST_KEY);
    log.info({ campId: String(camp._id), actorId }, 'camp created');
    return camp;
  },

  async update(id: string, input: UpdateCampInput, actorId: string) {
    const camp = await campRepo.findRaw(id);
    if (!camp) throw new NotFoundError('Camp', id);
    if (input.name) camp.name = input.name;
    if (input.description !== undefined) camp.description = input.description;
    if (input.address) camp.address = input.address;
    if (input.phone && camp.contactInfo) camp.contactInfo.phone = input.phone;
    if (input.email && camp.contactInfo) camp.contactInfo.email = input.email;
    if (input.staff) camp.staff = input.staff as unknown as typeof camp.staff;
    if (input.dateFrom) camp.dateFrom = input.dateFrom;
    if (input.dateTo) camp.dateTo = input.dateTo;
    if (camp.dateFrom && camp.dateTo && new Date(camp.dateTo) < new Date(camp.dateFrom)) {
      throw new ConflictError('End date cannot be earlier than start date');
    }
    camp.lastUpdatedBy = actorId as unknown as typeof camp.lastUpdatedBy;
    const saved = await camp.save();
    await auditService.record({ actorId, action: 'UPDATE', entityType: 'Camp', entityId: id });
    await invalidate(CAMP_LIST_KEY);
    return saved.toObject();
  },

  async remove(id: string, actorId: string) {
    const camp = await campRepo.findRaw(id);
    if (!camp) throw new NotFoundError('Camp', id);
    if (camp.createdBy?.toString() !== actorId) {
      throw new ForbiddenError('Only the camp creator may delete it');
    }
    await campRepo.deleteById(id);
    await auditService.record({ actorId, action: 'DELETE', entityType: 'Camp', entityId: id });
    await invalidate(CAMP_LIST_KEY);
    log.warn({ campId: id, actorId }, 'camp deleted');
  },

  async detail(id: string) {
    const camp = await campRepo.detail(id);
    if (!camp) throw new NotFoundError('Camp', id);
    const c = camp as Record<string, unknown> & { donorData?: unknown[]; bagsData?: unknown[] };
    const donorCount = c.donorData?.length ?? 0;
    const bagsCount = c.bagsData?.length ?? 0;
    delete c.donorData;
    delete c.bagsData;
    return { ...c, donorCount, bagsCount };
  },

  campList: () => cached(CAMP_LIST_KEY, CAMP_LIST_TTL, () => campRepo.campList()),

  all: () => campRepo.all(),
  staffList: () => campRepo.staffList(),

  async campDonations(campId: string) {
    const camp = (await campRepo.campDonations(campId)) as {
      name: string;
      campId: string;
      bagsData: unknown[];
    } | null;
    if (!camp) throw new NotFoundError('Camp', campId);
    return { campName: camp.name, campId: camp.campId, donations: camp.bagsData };
  },

  async campDonors(campId: string) {
    const camp = (await campRepo.campDonors(campId)) as {
      name: string;
      campId: string;
      donorData: unknown[];
    } | null;
    if (!camp) throw new NotFoundError('Camp', campId);
    return { campName: camp.name, campId: camp.campId, donors: camp.donorData };
  },

  async voluntary(f: VoluntaryFilter) {
    const { items, total } = await campRepo.voluntary(f);
    return {
      items,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / f.limit),
        currentPage: f.page,
        pageSize: f.limit,
      },
    };
  },
};
