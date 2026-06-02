// Site / camp repository. Reuses legacy Site, User and
// VoluntaryCampDonation models. Returns lean documents (the camp views
// are read-mostly and the shapes are passed through to the client).

import { Types } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SiteModel = require('../../../models/site-model.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserModel = require('../../../models/user-model.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const VoluntaryCampDonationModel = require('../../../models/voluntary-camp-donation-model.js');

export interface VoluntaryFilter {
  search?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  siteId?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const siteRepo = {
  async create(doc: Record<string, unknown>) {
    const created = await SiteModel.create(doc);
    return created.toObject();
  },

  async findRaw(id: string) {
    return SiteModel.findById(id);
  },

  async deleteById(id: string) {
    await SiteModel.findByIdAndDelete(id);
  },

  async detail(id: string) {
    return SiteModel.findById(id)
      .select(
        'siteId name description address contactInfo dateFrom dateTo createdBy lastUpdatedBy staff createdAt donorData bagsData',
      )
      .populate('createdBy', 'name phone email')
      .populate('lastUpdatedBy', 'name phone email')
      .populate('staff', 'name phone email role')
      .lean();
  },

  async campList() {
    return SiteModel.find()
      .select('siteId name description address contactInfo dateFrom dateTo createdAt createdBy staff')
      .populate('createdBy', 'name')
      .populate('staff', 'name')
      .sort({ createdAt: -1 })
      .lean();
  },

  async all() {
    return SiteModel.find()
      .populate('createdBy', 'name phone email')
      .populate('lastUpdatedBy', 'name phone email')
      .populate('staff', 'name phone email role')
      .lean();
  },

  async staffList() {
    return UserModel.find({}, { name: 1 }).select('_id name').lean();
  },

  async campDonations(siteId: string) {
    return SiteModel.findById(siteId)
      .select('name siteId bagsData')
      .populate({
        path: 'bagsData',
        select: 'bagNo segmentNo typeOfBag bloodGroup rh status collectionDate donor initialVitals',
        populate: { path: 'donor', select: 'name donorId' },
      })
      .lean();
  },

  async campDonors(siteId: string) {
    return SiteModel.findById(siteId)
      .select('name siteId donorData')
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
      filter.status = f.status.charAt(0).toUpperCase() + f.status.slice(1).toLowerCase();
    }
    if (f.startDate || f.endDate) {
      const range: Record<string, Date> = {};
      if (f.startDate) range.$gte = f.startDate;
      if (f.endDate) range.$lte = f.endDate;
      filter.createdAt = range;
    }
    if (f.siteId && f.siteId !== 'all' && Types.ObjectId.isValid(f.siteId)) {
      filter.siteId = new Types.ObjectId(f.siteId);
    }
    const skip = (f.page - 1) * f.limit;
    const sort: Record<string, 1 | -1> = { [f.sortBy]: f.sortOrder === 'desc' ? -1 : 1 };
    const [items, total] = await Promise.all([
      VoluntaryCampDonationModel.find(filter)
        .populate('siteId', 'name siteId')
        .skip(skip)
        .limit(f.limit)
        .sort(sort)
        .lean(),
      VoluntaryCampDonationModel.countDocuments(filter),
    ]);
    return { items, total };
  },
};
