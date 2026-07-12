// Read-only, cross-module aggregation for the legacy /api/serology
// list/detail views (bag worklist + finalized results). Mirrors the
// mis module's shape: no model of its own, reads models owned by
// tti/donation/unit/bag-inspection directly. Ported byte-for-byte
// from the old compatibility.routes.ts inline handlers so the
// response shape stays identical for existing callers.
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { DonorModel } from '@/modules/donor/donor.model';

export interface TtiBagListFilters {
  page?: number;
  limit?: number;
  search?: string;
  order?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
}

export interface TtiResultListFilters extends TtiBagListFilters {
  status?: string;
}

export interface TtiBagViewDto {
  _id: string;
  bagNo: string;
  donationId: string;
  donorName: string;
  segmentNo: string;
  bloodGroup: string;
  rh: string;
  siteId: { name: string };
  collectionDate: string;
  status: string;
  testResults: Array<{ test: string; result: string }>;
  /** False once any component from this donation has left the bank. */
  canEdit: boolean;
  editReason?: string;
  lastEditedAt?: string;
}

const ISSUED_STATUSES = new Set(['ISSUED', 'TRANSFUSED', 'RETURNED_UNUSED']);

function hasLeftBank(units: Array<{ status?: string; statusHistory?: Array<{ to?: string }> }>): boolean {
  return units.some(
    (u) => (u.status && ISSUED_STATUSES.has(u.status)) || (u.statusHistory || []).some((h) => h.to === 'ISSUED'),
  );
}

export interface PagedTtiBags {
  data: TtiBagViewDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

async function mapTtiBags(ttis: any[]): Promise<TtiBagViewDto[]> {
  const donationIds = ttis.map((t) => t.donationId);
  const donations = await DonationModel.find({
    donationId: { $in: donationIds },
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  })
    .populate('campId', 'name')
    .lean();

  const donationMap = new Map(donations.map((d) => [d.donationId, d]));

  const donorIds = donations.map((d) => d.donor).filter(Boolean);
  const donors = await DonorModel.find({ _id: { $in: donorIds } }).select('_id name').lean();
  const donorNameMap = new Map(
    donors.map((donor: any) => [
      donor._id.toString(),
      donor.name
        ? [donor.name.firstName, donor.name.middleName, donor.name.lastName].filter(Boolean).join(' ')
        : 'Unknown',
    ]),
  );

  const units = await BloodUnitModel.find({
    donationId: { $in: donationIds },
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  }).lean();
  const unitsMap: Record<string, typeof units> = {};
  units.forEach((u) => {
    if (u.donationId) {
      let arr = unitsMap[u.donationId];
      if (!arr) {
        arr = [];
        unitsMap[u.donationId] = arr;
      }
      arr.push(u);
    }
  });

  const inspections = await BagInspectionModel.find({
    bagNo: { $in: donationIds },
    deletedAt: null,
  }).lean();
  const inspectionMap = new Map(inspections.map((i) => [i.bagNo, i]));

  return ttis
    .map((t) => {
      const d = donationMap.get(t.donationId);
      const uList = unitsMap[t.donationId] || [];
      if (!d) return null;

      const existingTests = t.tests || [];
      const testResults = existingTests.map((et: any) => {
        let testName = et.testName;
        if (testName === 'SYPHILIS') testName = 'VDRL';
        if (testName === 'MALARIA') testName = 'MP';

        let resVal = et.result;
        if (resVal === 'INDETERMINATE') resVal = 'Shadeness';

        return { test: testName, result: resVal };
      });

      const inspection = inspectionMap.get(t.donationId);
      const segmentNo = inspection?.segmentNo || uList[0]?.unitDin || uList[0]?.unitId || '';

      return {
        _id: t._id.toString(),
        bagNo: (d as any).bagNo || t.donationId,
        donationId: t.donationId,
        donorName: d.donor ? donorNameMap.get(d.donor.toString()) || 'Unknown' : 'Unknown',
        segmentNo: (d as any).segmentNo || segmentNo,
        bloodGroup: t.aboGroupConfirmed || uList[0]?.aboGroup || 'O',
        rh: t.rhFactorConfirmed === 'NEGATIVE' ? 'Negative' : 'Positive',
        siteId: { name: d.campId ? (d.campId as any).name : 'Inhouse' },
        collectionDate: d.collectedAt.toISOString(),
        status:
          t.releaseDecision === 'released'
            ? 'passed'
            : t.releaseDecision === 'reactive'
              ? 'failed'
              : 'pending',
        testResults,
        canEdit: !hasLeftBank(uList),
        editReason: t.editReason || undefined,
        lastEditedAt: t.lastEditedAt ? new Date(t.lastEditedAt).toISOString() : undefined,
      };
    })
    .filter(Boolean) as TtiBagViewDto[];
}

export interface TtiLegacyViewRepo {
  /** TTI panels still awaiting a release decision (the serology worklist). */
  listQuarantined(filters: TtiBagListFilters): Promise<PagedTtiBags>;
  /** TTI panels already finalized (released or reactive). */
  listDecided(filters: TtiResultListFilters): Promise<PagedTtiBags>;
}

export function createTtiLegacyViewRepo(): TtiLegacyViewRepo {
  return {
    async listQuarantined(filters) {
      const { page, limit, search, order, fromDate, toDate } = filters;

      const separatedDonationIds = await BloodUnitModel.distinct('donationId', {
        status: 'QUARANTINE',
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      });

      const ttiFilter: any = {
        releaseDecision: 'pending',
        donationId: { $in: separatedDonationIds },
      };

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingDonations = await DonationModel.find({
          $and: [
            { $or: [{ donationId: searchRegex }, { bagNo: searchRegex }] },
            { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
          ],
        })
          .select('donationId')
          .lean();

        const matchedDonationIds = matchingDonations.map((d) => d.donationId);
        const targetIds = matchedDonationIds.filter((id) => separatedDonationIds.includes(id));
        ttiFilter.donationId = { $in: targetIds };
      }

      if (fromDate || toDate) {
        const collectedAtRange: any = {};
        if (fromDate) collectedAtRange.$gte = new Date(fromDate);
        if (toDate) collectedAtRange.$lte = new Date(`${toDate}T23:59:59`);
        const donationsInRange = await DonationModel.find({
          donationId: { $in: ttiFilter.donationId.$in },
          collectedAt: collectedAtRange,
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        })
          .select('donationId')
          .lean();
        ttiFilter.donationId = { $in: donationsInRange.map((d) => d.donationId) };
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skipNum = (pageNum - 1) * limitNum;
      const sortDir = order === 'asc' ? 1 : -1;

      const total = await TtiResultModel.countDocuments(ttiFilter);
      const ttis = await TtiResultModel.find(ttiFilter)
        .sort({ createdAt: sortDir })
        .skip(skipNum)
        .limit(limitNum)
        .lean();

      const data = await mapTtiBags(ttis);

      return { data, total, totalPages: Math.ceil(total / limitNum), page: pageNum, limit: limitNum };
    },

    async listDecided(filters) {
      const { page, limit, search, order, fromDate, toDate, status } = filters;

      const ttiFilter: any = { releaseDecision: { $ne: 'pending' } };

      if (status && status !== 'all') {
        if (status === 'passed') {
          ttiFilter.releaseDecision = 'released';
        } else if (status === 'failed' || status === 'discarded') {
          ttiFilter.releaseDecision = 'reactive';
        }
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingDonations = await DonationModel.find({
          $and: [
            { $or: [{ donationId: searchRegex }, { bagNo: searchRegex }] },
            { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
          ],
        })
          .select('donationId')
          .lean();

        const matchedDonationIds = matchingDonations.map((d) => d.donationId);
        ttiFilter.donationId = { $in: matchedDonationIds };
      }

      if (fromDate || toDate) {
        ttiFilter.decidedAt = {};
        if (fromDate) {
          const start = new Date(fromDate);
          start.setUTCHours(0, 0, 0, 0);
          ttiFilter.decidedAt.$gte = start;
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setUTCHours(23, 59, 59, 999);
          ttiFilter.decidedAt.$lte = end;
        }
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skipNum = (pageNum - 1) * limitNum;
      const sortDir = order === 'asc' ? 1 : -1;

      const total = await TtiResultModel.countDocuments(ttiFilter);
      const ttis = await TtiResultModel.find(ttiFilter)
        .sort({ decidedAt: sortDir })
        .skip(skipNum)
        .limit(limitNum)
        .lean();

      const data = await mapTtiBags(ttis);

      return { data, total, totalPages: Math.ceil(total / limitNum), page: pageNum, limit: limitNum };
    },
  };
}
