// Read-only aggregation layer for the MIS dashboard suite. Pulls from
// existing clinical/procurement collections instead of duplicating data —
// mirrors the monthly-report module's pattern (no Mongoose model of its own).

import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { CampModel } from '@/modules/camp/camp.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';

// Stored `componentType` values are already the canonical report codes
// (WB/PRBC/FFP/RDP/CRYO) post-migration, so no translation is needed.
const toProductLabel = (t: string) => t;

const DISCARD_LABEL: Record<string, string> = {
  EXPIRED: 'Expired',
  BAG_LEAK: 'Leakage / Other',
  HAEMOLYSED: 'Other',
  LIPAEMIC: 'Other',
  CLOTTED: 'Other',
  COLD_CHAIN_BREACH: 'Cold Chain Breach',
  CONTAMINATION: 'Contamination',
  QC_FAIL: 'QC Failure',
  UNUSED_AFTER_THAW: 'Unused After Thaw',
  DONOR_RECALL: 'Donor Recall / Lookback',
  LABEL_ERROR: 'Label Error',
  UNDERWEIGHT: 'Underweight',
  TTI_POSITIVE: 'TTI Positive',
};

function ageAt(dob: Date, at: Date): number {
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) age -= 1;
  return age;
}

function ageBucket(age: number): string {
  if (age < 18) return 'Under 18';
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  return '56+';
}

export interface MisRepo {
  getDonorStats(fromDate?: Date, toDate?: Date): Promise<any>;
  getDonationStats(fromDate?: Date, toDate?: Date): Promise<any>;
  getCampStats(fromDate?: Date, toDate?: Date): Promise<any>;
  getBagStats(fromDate?: Date, toDate?: Date): Promise<any>;
  getComponentStats(fromDate?: Date, toDate?: Date): Promise<any>;
  getInventoryStats(): Promise<any>;
  getIssueStats(): Promise<any>;
  getDiscardStats(): Promise<any>;
  getSerologyStats(): Promise<any>;
  getAuditStats(): Promise<any>;
  getRegulatoryStats(): Promise<any>;
  getExecutiveStats(period: '7d' | '30d' | 'all'): Promise<any>;
  getAnalyticsStats(): Promise<any>;
}

export function createMisRepo(): MisRepo {
  return {
    async getDonorStats(fromDate, toDate) {
      const dateFilter: Record<string, unknown> = { deletedAt: null };
      if (fromDate || toDate) {
        const range: Record<string, Date> = {};
        if (fromDate) range.$gte = fromDate;
        if (toDate) range.$lte = toDate;
        (dateFilter as any).createdAt = range;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const [
        total,
        newThisMonth,
        active,
        genderAgg,
        bloodGroupAgg,
        rhAgg,
        cityAgg,
        stateAgg,
        donors,
        repeatDonorCount,
      ] = await Promise.all([
        DonorModel.countDocuments(dateFilter),
        DonorModel.countDocuments({ deletedAt: null, createdAt: { $gte: startOfMonth } }),
        DonorModel.countDocuments({ deletedAt: null, lastDonationDate: { $gte: ninetyDaysAgo } }),
        DonorModel.aggregate([{ $match: dateFilter }, { $group: { _id: '$sex', count: { $sum: 1 } } }]),
        DonorModel.aggregate([{ $match: dateFilter }, { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }]),
        DonorModel.aggregate([{ $match: dateFilter }, { $group: { _id: '$rh', count: { $sum: 1 } } }]),
        DonorModel.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$address.city', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        DonorModel.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$address.state', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        DonorModel.find(dateFilter)
          .select('donorId name bloodGroup rh sex address phone lastDonationDate createdAt')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        DonationModel.aggregate([
          { $group: { _id: '$donor', donations: { $sum: 1 } } },
          { $match: { donations: { $gt: 1 } } },
          { $count: 'repeatDonors' },
        ]),
      ]);

      const ageAgg = (donors as any[]).reduce((acc: Record<string, number>, d) => {
        if (!d.dob) return acc;
        const bucket = ageBucket(ageAt(new Date(d.dob), now));
        acc[bucket] = (acc[bucket] ?? 0) + 1;
        return acc;
      }, {});

      const repeatDonors = (repeatDonorCount as any[])[0]?.repeatDonors ?? 0;
      const repeatPercentage = total > 0 ? Math.round((repeatDonors / total) * 1000) / 10 : 0;

      return {
        stats: {
          total,
          newThisMonth,
          active,
          gender: genderAgg,
          bloodGroup: bloodGroupAgg,
          rh: rhAgg,
          city: cityAgg,
          state: stateAgg,
          age: Object.entries(ageAgg).map(([_id, count]) => ({ _id, count })),
        },
        behavior: { repeatPercentage, repeatDonors },
        register: { donors },
      };
    },

    async getDonationStats(fromDate, toDate) {
      const now = new Date();
      const from = fromDate ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const to = toDate ?? now;
      const filter = { collectedAt: { $gte: from, $lte: to }, deletedAt: null };

      const [total, bySiteRaw, byBloodGroupAgg, byTypeAgg, donations] = await Promise.all([
        DonationModel.countDocuments(filter),
        DonationModel.aggregate([
          { $match: filter },
          { $group: { _id: { $cond: [{ $ifNull: ['$campId', false] }, 'Camp', 'In-house'] }, count: { $sum: 1 } } },
        ]),
        DonationModel.aggregate([
          { $match: filter },
          { $lookup: { from: 'donors', localField: 'donor', foreignField: '_id', as: 'd' } },
          { $unwind: '$d' },
          { $group: { _id: '$d.bloodGroup', count: { $sum: 1 } } },
        ]),
        DonationModel.aggregate([{ $match: filter }, { $group: { _id: '$donationType', count: { $sum: 1 } } }]),
        DonationModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const byGenderAgg = await DonationModel.aggregate([
        { $match: filter },
        { $lookup: { from: 'donors', localField: 'donor', foreignField: '_id', as: 'd' } },
        { $unwind: '$d' },
        { $group: { _id: '$d.sex', count: { $sum: 1 } } },
      ]);

      return {
        summary: { total },
        breakdowns: {
          bySite: bySiteRaw,
          byBloodGroup: byBloodGroupAgg,
          byGender: byGenderAgg,
          byType: byTypeAgg,
        },
        trends: (donations as any[]).map((d) => ({ date: d._id, count: d.count })),
      };
    },

    async getCampStats(fromDate, toDate) {
      const filter: Record<string, unknown> = {};
      if (fromDate || toDate) {
        const range: Record<string, Date> = {};
        if (fromDate) range.$gte = fromDate;
        if (toDate) range.$lte = toDate;
        filter.dateFrom = range;
      }

      const camps = await CampModel.find(filter).select('name campId address dateFrom dateTo').lean();
      if (camps.length === 0) return [];

      const campIds = camps.map((c: any) => c._id);
      const [donationAgg, discardAgg, ttiAgg] = await Promise.all([
        DonationModel.aggregate([
          { $match: { campId: { $in: campIds }, deletedAt: null } },
          { $group: { _id: '$campId', totalBags: { $sum: 1 }, donors: { $addToSet: '$donor' } } },
        ]),
        BloodUnitModel.aggregate([
          { $match: { campId: { $in: campIds }, status: 'DISCARDED' } },
          { $group: { _id: '$campId', count: { $sum: 1 } } },
        ]),
        TtiResultModel.aggregate([
          { $match: { releaseDecision: 'quarantined' } },
          { $lookup: { from: 'donations', localField: 'donationId', foreignField: 'donationId', as: 'don' } },
          { $unwind: '$don' },
          { $match: { 'don.campId': { $in: campIds } } },
          { $group: { _id: '$don.campId', count: { $sum: 1 } } },
        ]),
      ]);

      const donationByCamp = new Map((donationAgg as any[]).map((d) => [String(d._id), d]));
      const discardByCamp = new Map((discardAgg as any[]).map((d) => [String(d._id), d.count]));
      const ttiByCamp = new Map((ttiAgg as any[]).map((d) => [String(d._id), d.count]));

      return camps.map((c: any) => {
        const cid = String(c._id);
        const don = donationByCamp.get(cid);
        return {
          name: c.name,
          campId: c.campId,
          address: c.address,
          dateFrom: c.dateFrom,
          dateTo: c.dateTo,
          donorCount: don?.donors?.length ?? 0,
          totalBags: don?.totalBags ?? 0,
          discardedBags: discardByCamp.get(cid) ?? 0,
          serologyFailures: ttiByCamp.get(cid) ?? 0,
        };
      });
    },

    async getBagStats(fromDate, toDate) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (fromDate || toDate) {
        const range: Record<string, Date> = {};
        if (fromDate) range.$gte = fromDate;
        if (toDate) range.$lte = toDate;
        filter.collectedAt = range;
      }

      const [units, statsAgg, componentAgg] = await Promise.all([
        BloodUnitModel.find(filter)
          .select('unitId donationId componentType aboGroup rhFactor status collectedAt')
          .sort({ collectedAt: -1 })
          .limit(100)
          .lean(),
        BloodUnitModel.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        BloodUnitModel.aggregate([
          { $match: filter },
          { $group: { _id: '$componentType', count: { $sum: 1 } } },
        ]),
      ]);

      const donationIds = [...new Set((units as any[]).map((u) => u.donationId))];
      const donations = donationIds.length
        ? await DonationModel.find({ donationId: { $in: donationIds } })
            .select('donationId bagNo donor')
            .populate('donor', 'donorId')
            .lean()
        : [];
      const donationByDonationId = new Map((donations as any[]).map((d) => [d.donationId, d]));

      const bags = (units as any[]).map((u) => {
        const don = donationByDonationId.get(u.donationId);
        return {
          _id: u._id,
          bagNo: don?.bagNo ?? u.donationId,
          donor: don?.donor ? { donorId: (don.donor as any).donorId } : undefined,
          bloodGroup: `${u.aboGroup}${u.rhFactor === 'POSITIVE' ? '+' : '-'}`,
          collectionDate: u.collectedAt,
          status: u.status,
          componentType: toProductLabel(u.componentType),
        };
      });

      return {
        register: { bags },
        stats: statsAgg,
        byComponent: componentAgg.map((c: any) => ({ _id: toProductLabel(c._id), count: c.count })),
      };
    },

    async getComponentStats(fromDate, toDate) {
      const filter: Record<string, unknown> = { componentType: { $ne: 'WB' } };
      if (fromDate || toDate) {
        const range: Record<string, Date> = {};
        if (fromDate) range.$gte = fromDate;
        if (toDate) range.$lte = toDate;
        filter.collectedAt = range;
      }

      const [productionAgg, statusAgg, units] = await Promise.all([
        BloodUnitModel.aggregate([
          { $match: filter },
          { $group: { _id: '$componentType', count: { $sum: 1 }, avgVolume: { $avg: '$volumeMl' } } },
        ]),
        BloodUnitModel.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        BloodUnitModel.find({ ...filter, status: { $in: ['RELEASED', 'RESERVED', 'CROSSMATCHED'] } })
          .select('expiresAt bloodGroup aboGroup rhFactor')
          .lean(),
      ]);

      const now = new Date();
      const ageingBuckets: Record<string, number> = { '0-7': 0, '8-14': 0, '15-21': 0, '22+': 0, Expired: 0 };
      for (const u of units as any[]) {
        const daysLeft = Math.ceil((new Date(u.expiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        const bucket = daysLeft < 0 ? 'Expired' : daysLeft <= 7 ? '0-7' : daysLeft <= 14 ? '8-14' : daysLeft <= 21 ? '15-21' : '22+';
        ageingBuckets[bucket] = (ageingBuckets[bucket] ?? 0) + 1;
      }

      const bloodGroupAgg = await BloodUnitModel.aggregate([
        { $match: { ...filter, status: { $in: ['RELEASED', 'RESERVED', 'CROSSMATCHED'] } } },
        { $group: { _id: { g: '$aboGroup', rh: '$rhFactor' }, count: { $sum: 1 } } },
      ]);

      return {
        production: productionAgg.map((p: any) => ({ _id: toProductLabel(p._id), count: p.count, avgVolume: p.avgVolume })),
        ageing: Object.entries(ageingBuckets).map(([_id, count]) => ({ _id, count })),
        status: statusAgg,
        bloodGroup: bloodGroupAgg.map((b: any) => ({
          _id: `${b._id.g}${b._id.rh === 'POSITIVE' ? '+' : '-'}`,
          count: b.count,
        })),
      };
    },

    async getInventoryStats() {
      const rows = await BloodUnitModel.aggregate([
        { $match: { status: 'RELEASED' } },
        {
          $group: {
            _id: { group: '$aboGroup', rh: '$rhFactor', type: '$componentType' },
            count: { $sum: 1 },
          },
        },
      ]);

      const now = new Date();
      const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const nearExpiry = await BloodUnitModel.countDocuments({
        status: 'RELEASED',
        expiresAt: { $lte: threeDaysOut },
      });

      return rows.map((r: any) => ({
        _id: {
          group: r._id.group,
          rh: r._id.rh === 'POSITIVE' ? '+' : '-',
          type: toProductLabel(r._id.type),
        },
        count: r.count,
        nearExpiryContext: nearExpiry,
      }));
    },

    async getIssueStats() {
      const [issuesAgg, hospitalAgg, componentAgg] = await Promise.all([
        RequisitionModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        RequisitionModel.aggregate([
          { $match: { status: { $in: ['ISSUED', 'COMPLETED'] } } },
          { $lookup: { from: 'hospitals', localField: 'hospitalId', foreignField: '_id', as: 'h' } },
          { $unwind: '$h' },
          { $unwind: '$matchedUnits' },
          { $group: { _id: '$h.name', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        IssueModel.aggregate([
          { $group: { _id: null, total: { $sum: 1 } } },
        ]),
      ]);

      return { issues: issuesAgg, hospitalWise: hospitalAgg, totalIssued: (componentAgg as any[])[0]?.total ?? 0 };
    },

    async getDiscardStats() {
      const units = await BloodUnitModel.find({ status: 'DISCARDED' })
        .select('discardReason componentType statusHistory')
        .lean();

      const reasonCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      for (const u of units as any[]) {
        const reason = DISCARD_LABEL[u.discardReason] ?? u.discardReason ?? 'Other';
        reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
        const type = toProductLabel(u.componentType);
        typeCounts[type] = (typeCounts[type] ?? 0) + 1;
      }

      return {
        discards: Object.entries(reasonCounts).map(([_id, count]) => ({ _id, count })),
        typeWise: Object.entries(typeCounts).map(([_id, count]) => ({ _id, count })),
      };
    },

    async getSerologyStats() {
      const results = await TtiResultModel.find().select('tests releaseDecision').lean();

      const failureCounts: Record<string, number> = {};
      const overallCounts: Record<string, number> = { Released: 0, Quarantined: 0, Pending: 0 };
      let totalTests = 0;
      let reactiveTests = 0;

      for (const r of results as any[]) {
        const bucket = r.releaseDecision === 'released' ? 'Released' : r.releaseDecision === 'quarantined' ? 'Quarantined' : 'Pending';
        overallCounts[bucket] = (overallCounts[bucket] ?? 0) + 1;

        for (const t of r.tests || []) {
          totalTests += 1;
          if (t.result === 'REACTIVE') {
            reactiveTests += 1;
            failureCounts[t.testName] = (failureCounts[t.testName] ?? 0) + 1;
          }
        }
      }

      return {
        failures: Object.entries(failureCounts).map(([_id, count]) => ({ _id, count })),
        overall: Object.entries(overallCounts).map(([_id, count]) => ({ _id, count })),
        reactiveRate: totalTests > 0 ? Math.round((reactiveTests / totalTests) * 1000) / 10 : 0,
        totalTests,
      };
    },

    async getAuditStats() {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [stuckInTesting, nearExpiry, longQuarantine, expiredNotDiscarded] = await Promise.all([
        BloodUnitModel.countDocuments({ status: 'IN_TESTING', collectedAt: { $lte: oneDayAgo } }),
        BloodUnitModel.countDocuments({ status: 'RELEASED', expiresAt: { $lte: threeDaysOut, $gte: new Date() } }),
        BloodUnitModel.countDocuments({ status: 'QUARANTINE', collectedAt: { $lte: sevenDaysAgo } }),
        BloodUnitModel.countDocuments({ status: { $nin: ['DISCARDED', 'EXPIRED'] }, expiresAt: { $lt: new Date() } }),
      ]);

      return { stuckInTesting, nearExpiry, longQuarantine, expiredNotDiscarded };
    },

    async getRegulatoryStats() {
      const [collection, production, issued, discarded, ttiResults] = await Promise.all([
        DonationModel.countDocuments({ deletedAt: null }),
        BloodUnitModel.countDocuments({ componentType: { $ne: 'WB' } }),
        BloodUnitModel.countDocuments({ status: { $in: ['ISSUED', 'TRANSFUSED'] } }),
        BloodUnitModel.countDocuments({ status: 'DISCARDED' }),
        TtiResultModel.find().select('tests').lean(),
      ]);

      let tested = 0;
      let reactive = 0;
      const byDisease: Record<string, number> = {};
      for (const r of ttiResults as any[]) {
        for (const t of r.tests || []) {
          tested += 1;
          if (t.result === 'REACTIVE') {
            reactive += 1;
            byDisease[t.testName] = (byDisease[t.testName] ?? 0) + 1;
          }
        }
      }

      return {
        collection,
        production,
        issued,
        discarded,
        testing: {
          tested,
          reactive,
          reactiveRate: tested > 0 ? Math.round((reactive / tested) * 1000) / 10 : 0,
        },
        testingByDisease: Object.entries(byDisease).map(([test, count]) => ({ test, count })),
      };
    },

    async getExecutiveStats(period) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const trendFrom =
        period === '7d'
          ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          : period === 'all'
            ? new Date(0)
            : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        donationsToday,
        donationsMonth,
        donorsMonth,
        issuedMonth,
        stock,
        campsMonth,
        discardsMonth,
        trendAgg,
      ] = await Promise.all([
        DonationModel.countDocuments({ collectedAt: { $gte: startOfToday }, deletedAt: null }),
        DonationModel.countDocuments({ collectedAt: { $gte: startOfMonth }, deletedAt: null }),
        DonorModel.countDocuments({ createdAt: { $gte: startOfMonth }, deletedAt: null }),
        BloodUnitModel.countDocuments({ issuedAt: { $gte: startOfMonth } }),
        BloodUnitModel.countDocuments({ status: 'RELEASED' }),
        CampModel.countDocuments({ dateFrom: { $gte: startOfMonth } }),
        BloodUnitModel.countDocuments({ status: 'DISCARDED', updatedAt: { $gte: startOfMonth } }),
        DonationModel.aggregate([
          { $match: { collectedAt: { $gte: trendFrom }, deletedAt: null } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const issuePerDonation = donationsMonth > 0 ? Math.round((issuedMonth / donationsMonth) * 100) / 100 : 0;
      const discardRate = donationsMonth > 0 ? Math.round((discardsMonth / donationsMonth) * 1000) / 10 : 0;

      return {
        kpis: { donationsToday, donationsMonth, donorsMonth, issuedMonth, stock, campsMonth, discardsMonth },
        ratios: { issuePerDonation, discardRate },
        trends: (trendAgg as any[]).map((d) => ({ date: d._id, value: d.count })),
      };
    },

    async getAnalyticsStats() {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfMonthBefore = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      const [lastMonthDonations, lastMonthIssues, priorMonthDonations, priorMonthIssues, stock] = await Promise.all([
        DonationModel.countDocuments({ collectedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }, deletedAt: null }),
        BloodUnitModel.countDocuments({ issuedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
        DonationModel.countDocuments({ collectedAt: { $gte: startOfMonthBefore, $lt: startOfLastMonth }, deletedAt: null }),
        BloodUnitModel.countDocuments({ issuedAt: { $gte: startOfMonthBefore, $lt: startOfLastMonth } }),
        BloodUnitModel.countDocuments({ status: 'RELEASED' }),
      ]);

      // Naive linear forecast: extrapolate month-over-month growth rate.
      const donationGrowth = priorMonthDonations > 0 ? (lastMonthDonations - priorMonthDonations) / priorMonthDonations : 0;
      const demandGrowth = priorMonthIssues > 0 ? (lastMonthIssues - priorMonthIssues) / priorMonthIssues : 0;
      const forecastDonations = Math.round(lastMonthDonations * (1 + Math.max(-0.5, Math.min(0.5, donationGrowth))));
      const forecastDemand = Math.round(lastMonthIssues * (1 + Math.max(-0.5, Math.min(0.5, demandGrowth))));

      const shortageRisk = forecastDemand > forecastDonations + stock ? 'High' : 'Low';

      return {
        lastMonth: { donations: lastMonthDonations, issues: lastMonthIssues },
        forecast: { donations: forecastDonations, demand: forecastDemand },
        shortageRisk,
        currentStock: stock,
      };
    },
  };
}
