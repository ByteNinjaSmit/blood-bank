import { childLogger } from '@/core/logger';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { siteRepo, type VoluntaryFilter } from './site.repository';

export interface CreateSiteInput {
  siteId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  staff: string[];
  dateFrom: Date;
  dateTo: Date;
}
export interface UpdateSiteInput {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  staff?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

const log = childLogger({ module: 'site-service' });

export const siteService = {
  async create(input: CreateSiteInput, actorId: string) {
    if (input.dateTo < input.dateFrom) {
      throw new ConflictError('End date cannot be earlier than start date');
    }
    const site = await siteRepo.create({
      siteId: input.siteId,
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
    await auditService.record({ actorId, action: 'CREATE', entityType: 'Site', entityId: String(site._id) });
    log.info({ siteId: String(site._id), actorId }, 'site created');
    return site;
  },

  async update(id: string, input: UpdateSiteInput, actorId: string) {
    const site = await siteRepo.findRaw(id);
    if (!site) throw new NotFoundError('Site', id);
    if (input.name) site.name = input.name;
    if (input.description !== undefined) site.description = input.description;
    if (input.address) site.address = input.address;
    if (input.phone) site.contactInfo.phone = input.phone;
    if (input.email) site.contactInfo.email = input.email;
    if (input.staff) site.staff = input.staff;
    if (input.dateFrom) site.dateFrom = input.dateFrom;
    if (input.dateTo) site.dateTo = input.dateTo;
    if (site.dateFrom && site.dateTo && new Date(site.dateTo) < new Date(site.dateFrom)) {
      throw new ConflictError('End date cannot be earlier than start date');
    }
    site.lastUpdatedBy = actorId;
    const saved = await site.save();
    await auditService.record({ actorId, action: 'UPDATE', entityType: 'Site', entityId: id });
    return saved.toObject();
  },

  async remove(id: string, actorId: string) {
    const site = await siteRepo.findRaw(id);
    if (!site) throw new NotFoundError('Site', id);
    // Only the creator may delete (preserves legacy rule).
    if (site.createdBy?.toString() !== actorId) {
      throw new ForbiddenError('Only the site creator may delete it');
    }
    await siteRepo.deleteById(id);
    await auditService.record({ actorId, action: 'DELETE', entityType: 'Site', entityId: id });
    log.warn({ siteId: id, actorId }, 'site deleted');
  },

  async detail(id: string) {
    const site = await siteRepo.detail(id);
    if (!site) throw new NotFoundError('Site', id);
    const s = site as Record<string, unknown> & { donorData?: unknown[]; bagsData?: unknown[] };
    const donorCount = s.donorData?.length ?? 0;
    const bagsCount = s.bagsData?.length ?? 0;
    delete s.donorData;
    delete s.bagsData;
    return { ...s, donorCount, bagsCount };
  },

  campList: () => siteRepo.campList(),
  all: () => siteRepo.all(),
  staffList: () => siteRepo.staffList(),

  async campDonations(siteId: string) {
    const site = (await siteRepo.campDonations(siteId)) as
      | { name: string; siteId: string; bagsData: unknown[] }
      | null;
    if (!site) throw new NotFoundError('Site', siteId);
    return { siteName: site.name, siteId: site.siteId, donations: site.bagsData };
  },

  async campDonors(siteId: string) {
    const site = (await siteRepo.campDonors(siteId)) as
      | { name: string; siteId: string; donorData: unknown[] }
      | null;
    if (!site) throw new NotFoundError('Site', siteId);
    return { siteName: site.name, siteId: site.siteId, donors: site.donorData };
  },

  async voluntary(f: VoluntaryFilter) {
    const { items, total } = await siteRepo.voluntary(f);
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
