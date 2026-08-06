import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { campRepo, type VoluntaryFilter } from './camp.repository';
import { toDto as donorToDto } from '@/modules/donor/donor.repository';
import { DonationModel } from '@/modules/donation/donation.model';

export interface CreateCampInput {
  campId: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  staff: string[];
  volunteers?: string[];
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
  volunteers?: string[];
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
      volunteers: input.volunteers ?? [],
    });
    await auditService.record({
      actorId,
      module: 'camp',
      action: 'CREATE',
      entityType: 'Camp',
      entityId: String(camp._id),
      entityLabel: camp.campId,
      after: { campId: camp.campId, name: camp.name, dateFrom: camp.dateFrom, dateTo: camp.dateTo },
    });
    await invalidate(`${CAMP_LIST_KEY}*`);
    log.info({ campId: String(camp._id), actorId }, 'camp created');
    return camp;
  },

  async update(id: string, input: UpdateCampInput, actorId: string, editReason?: string) {
    const camp = await campRepo.findRaw(id);
    if (!camp) throw new NotFoundError('Camp', id);
    const before = {
      name: camp.name,
      description: camp.description,
      address: camp.address,
      contactInfo: camp.contactInfo ? { ...camp.contactInfo } : undefined,
      staff: camp.staff,
      volunteers: camp.volunteers,
      dateFrom: camp.dateFrom,
      dateTo: camp.dateTo,
    };
    if (input.name) camp.name = input.name;
    if (input.description !== undefined) camp.description = input.description;
    if (input.address) camp.address = input.address;
    if (input.phone && camp.contactInfo) camp.contactInfo.phone = input.phone;
    if (input.email && camp.contactInfo) camp.contactInfo.email = input.email;
    if (input.staff) camp.staff = input.staff as unknown as typeof camp.staff;
    if (input.volunteers) camp.volunteers = input.volunteers;
    if (input.dateFrom) camp.dateFrom = input.dateFrom;
    if (input.dateTo) camp.dateTo = input.dateTo;
    if (camp.dateFrom && camp.dateTo && new Date(camp.dateTo) < new Date(camp.dateFrom)) {
      throw new ConflictError('End date cannot be earlier than start date');
    }
    camp.lastUpdatedBy = actorId as unknown as typeof camp.lastUpdatedBy;
    const saved = await camp.save();
    await auditService.record({
      actorId,
      module: 'camp',
      action: 'UPDATE',
      entityType: 'Camp',
      entityId: id,
      entityLabel: camp.campId,
      before,
      after: {
        name: saved.name,
        description: saved.description,
        address: saved.address,
        contactInfo: saved.contactInfo,
        staff: saved.staff,
        volunteers: saved.volunteers,
        dateFrom: saved.dateFrom,
        dateTo: saved.dateTo,
      },
      reason: editReason,
    });
    await invalidate(`${CAMP_LIST_KEY}*`);
    return saved.toObject();
  },

  async remove(id: string, actorId: string, reason: string) {
    const camp = await campRepo.findRaw(id);
    if (!camp) throw new NotFoundError('Camp', id);
    if (camp.createdBy?.toString() !== actorId) {
      throw new ForbiddenError('Only the camp creator may delete it');
    }

    if (!camp.deletedAt) {
      // First delete click: soft-delete only. Row stays visible (greyed
      // out) in the camp list so donation history tied to it isn't lost.
      await campRepo.softDelete(id, actorId);
      await auditService.record({
        actorId,
        module: 'camp',
        action: 'DELETE',
        entityType: 'Camp',
        entityId: id,
        entityLabel: camp.campId,
        severity: 'warning',
        before: { deletedAt: camp.deletedAt },
        after: { deletedAt: new Date() },
        reason,
      });
      await invalidate(`${CAMP_LIST_KEY}*`);
      log.warn({ campId: id, actorId }, 'camp soft-deleted');
      return { permanentlyDeleted: false };
    }

    // Second delete click on an already soft-deleted camp: permanent,
    // irreversible. Refuse if donations were ever recorded against it.
    const hasDonations = await DonationModel.exists({ campId: id, deletedAt: null });
    if (hasDonations) {
      throw new ConflictError('Camp has donation records and cannot be permanently deleted');
    }
    await campRepo.deleteById(id);
    await auditService.record({
      actorId,
      module: 'camp',
      action: 'DELETE',
      entityType: 'Camp',
      entityId: id,
      entityLabel: camp.campId,
      severity: 'critical',
      before: camp.toObject(),
      reason,
    });
    await invalidate(`${CAMP_LIST_KEY}*`);
    log.warn({ campId: id, actorId }, 'camp permanently deleted');
    return { permanentlyDeleted: true };
  },

  async restore(id: string, actorId: string) {
    const camp = await campRepo.findRaw(id);
    if (!camp) throw new NotFoundError('Camp', id);
    if (camp.createdBy?.toString() !== actorId) {
      throw new ForbiddenError('Only the camp creator may restore it');
    }
    if (!camp.deletedAt) {
      return { restored: false };
    }
    await campRepo.restore(id, actorId);
    await auditService.record({
      actorId,
      module: 'camp',
      action: 'UPDATE',
      entityType: 'Camp',
      entityId: id,
      entityLabel: camp.campId,
      before: { deletedAt: camp.deletedAt },
      after: { deletedAt: null },
    });
    await invalidate(`${CAMP_LIST_KEY}*`);
    log.warn({ campId: id, actorId }, 'camp restored');
    return { restored: true };
  },

  async detail(id: string) {
    const camp = await campRepo.detail(id);
    if (!camp) throw new NotFoundError('Camp', id);
    const c = camp as Record<string, unknown> & {
      _id: unknown;
      donorData?: unknown[];
      unitData?: unknown[];
    };
    const donorCount = c.donorData?.length ?? 0;
    const unitCount = c.unitData?.length ?? 0;
    const donationCount = await DonationModel.countDocuments({ campId: c._id, deletedAt: null });
    delete c.donorData;
    delete c.unitData;
    return { ...c, donorCount, unitCount, donationCount };
  },

  campList: (deletedOnly = false) =>
    cached(`${CAMP_LIST_KEY}:${deletedOnly ? 'deleted' : 'active'}`, CAMP_LIST_TTL, () =>
      campRepo.campList(deletedOnly),
    ),

  all: () => campRepo.all(),
  staffList: () => campRepo.staffList(),

  async campDonations(campId: string) {
    const camp = (await campRepo.campDonations(campId)) as {
      name: string;
      campId: string;
      unitData: unknown[];
    } | null;
    if (!camp) throw new NotFoundError('Camp', campId);
    return { campName: camp.name, campId: camp.campId, units: camp.unitData };
  },

  async campDonors(campId: string) {
    const camp = (await campRepo.campDonors(campId)) as {
      name: string;
      campId: string;
      donorData: unknown[];
    } | null;
    if (!camp) throw new NotFoundError('Camp', campId);
    const mappedDonors = (camp.donorData || []).map((d) => donorToDto(d));
    return { campName: camp.name, campId: camp.campId, donors: mappedDonors };
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

  async updateVoluntaryStatus(id: string, status: string) {
    return campRepo.updateVoluntaryStatus(id, status);
  },
};
