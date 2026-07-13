import { Types } from 'mongoose';
import { CampModel } from './camp.model';
import { CampDonationModel } from './camp-donation.model';
import { UserModel } from '@/modules/user/user.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { NotFoundError } from '@/shared/errors';

export interface VoluntaryFilter {
  search?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  campId?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const campRepo = {
  async create(doc: Record<string, unknown>) {
    const created = await CampModel.create(doc);
    return created.toObject();
  },

  async findRaw(id: string) {
    return CampModel.findById(id);
  },

  async softDelete(id: string, actorId: string) {
    const result = await CampModel.updateOne(
      { _id: id },
      { deletedAt: new Date(), lastUpdatedBy: actorId },
    );
    if (result.matchedCount === 0) throw new NotFoundError('Camp', id);
  },

  async restore(id: string, actorId: string) {
    const result = await CampModel.updateOne(
      { _id: id },
      { deletedAt: null, lastUpdatedBy: actorId },
    );
    if (result.matchedCount === 0) throw new NotFoundError('Camp', id);
  },

  // Permanent, irreversible removal — only reached once a camp has already
  // been soft-deleted (see camp.service.ts remove()).
  async deleteById(id: string) {
    await CampModel.findByIdAndDelete(id);
  },

  async detail(id: string) {
    return CampModel.findById(id)
      .select(
        'campId name description address contactInfo dateFrom dateTo createdBy lastUpdatedBy staff createdAt donorData unitData deletedAt',
      )
      .populate('createdBy', 'name phone email')
      .populate('lastUpdatedBy', 'name phone email')
      .populate('staff', 'name phone email role')
      .lean();
  },

  async campList(deletedOnly = false) {
    // donorData/unitData are ObjectId-only ref arrays (cheap to select, unlike
    // populating full Donor/BloodUnit docs) — selected only to derive counts
    // for the listing/export, then stripped before returning.
    const camps = await CampModel.find(
      deletedOnly ? { deletedAt: { $ne: null } } : { deletedAt: null },
    )
      .select(
        'campId name description address contactInfo dateFrom dateTo createdAt createdBy staff deletedAt donorData unitData',
      )
      .populate('createdBy', 'name')
      .populate('staff', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const campIds = camps.map((c) => c._id);
    const donationCounts = await DonationModel.aggregate([
      { $match: { campId: { $in: campIds }, deletedAt: null } },
      { $group: { _id: '$campId', count: { $sum: 1 } } },
    ]);
    const donationCountMap = new Map(donationCounts.map((d) => [d._id.toString(), d.count as number]));

    return camps.map((c) => {
      const donorCount = c.donorData?.length ?? 0;
      const unitCount = c.unitData?.length ?? 0;
      const donationCount = donationCountMap.get(c._id.toString()) ?? 0;
      const { donorData, unitData, ...rest } = c;
      return { ...rest, donorCount, unitCount, donationCount };
    });
  },

  async all() {
    return CampModel.find()
      .populate('createdBy', 'name phone email')
      .populate('lastUpdatedBy', 'name phone email')
      .populate('staff', 'name phone email role')
      .lean();
  },

  async staffList() {
    return UserModel.find({}, { name: 1 }).select('_id name').lean();
  },

  async campDonations(campId: string) {
    return CampModel.findById(campId)
      .select('name campId unitData')
      .populate({
        path: 'unitData',
        select:
          'unitId componentType aboGroup rhFactor status collectedAt expiresAt donationId campId',
      })
      .lean();
  },

  async campDonors(campId: string) {
    return CampModel.findById(campId)
      .select('name campId donorData')
      .populate({
        path: 'donorData',
        select:
          'donorId name.firstName name.middleName name.lastName dob uid phone email sex eligibilityStatus lastDonationDate address bloodGroup occupation rh weightKg',
      })
      .lean();
  },

  async voluntary(f: VoluntaryFilter) {
    const filter: Record<string, unknown> = {};
    if (f.search) {
      const rx = new RegExp(f.search, 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { mobile: rx }, { bloodGroup: rx }];
    }
    if (f.status && f.status !== 'all') {
      filter.status = f.status.toUpperCase();
    }
    if (f.startDate || f.endDate) {
      const range: Record<string, Date> = {};
      if (f.startDate) range.$gte = f.startDate;
      if (f.endDate) range.$lte = f.endDate;
      filter.createdAt = range;
    }
    if (f.campId && f.campId !== 'all' && Types.ObjectId.isValid(f.campId)) {
      filter.campId = new Types.ObjectId(f.campId);
    }
    const skip = (f.page - 1) * f.limit;
    const sort: Record<string, 1 | -1> = { [f.sortBy]: f.sortOrder === 'desc' ? -1 : 1 };
    const [items, total] = await Promise.all([
      CampDonationModel.find(filter)
        .populate('campId', 'name campId')
        .skip(skip)
        .limit(f.limit)
        .sort(sort)
        .lean(),
      CampDonationModel.countDocuments(filter),
    ]);
    return { items, total };
  },
};
