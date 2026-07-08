// Dashboard — read-only aggregation layer over other modules' data.
// Owns no collection; composes existing repositories where they already
// expose the right shape (chemical-inventory, bag-stock, bulk-transfer)
// and aggregates directly against BloodUnit/Camp/BagDiscard/Deferral
// where no reusable function exists yet.

import { CampModel } from '@/modules/camp/camp.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { BagDiscardModel } from '@/modules/bag-discard/bag-discard.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DonorCardModel } from '@/modules/donor-card/donor-card.model';
import { IssueModel } from '@/modules/issue/issue.model';
import type { ChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import type { BagStockRepo, BagStockSummaryItem, LowBoxBatchDto } from '@/modules/bag-stock/bag-stock.repository';
import type { BulkTransferRepo, BulkTransferDto } from '@/modules/bulk-transfer/bulk-transfer.repository';

const LOW_BOX_THRESHOLD = 3;

export interface CampSummaryDto {
  id: string;
  campId: string;
  name: string;
  address: string;
  dateFrom: string;
  dateTo: string;
  staffCount: number;
}

export interface CampOverviewDto {
  upcoming: CampSummaryDto[];
  ongoing: CampSummaryDto[];
  completedLast30Days: CampSummaryDto[];
}

export interface BagStockSectionDto {
  byType: BagStockSummaryItem[];
  lowBoxBatches: LowBoxBatchDto[];
}

export interface BulkTransferSectionDto {
  given: { total: number; recent: BulkTransferDto[] };
  taken: { total: number; recent: BulkTransferDto[] };
}

export interface DiseaseBucketDto {
  unitsIssuedCount: number;
  byBloodGroup: Array<{ bloodGroup: string; count: number }>;
  patients: Array<{ name: string; unitsIssued: number }>;
}

export interface DiseaseSectionDto {
  thalassemia: DiseaseBucketDto;
  sickleCellAnaemia: DiseaseBucketDto;
  other: DiseaseBucketDto;
}

export interface StorageBreakdownItemDto {
  location: string;
  count: number;
}

export interface DiscardSectionDto {
  bagLevel: Array<{ reason: string; quantity: number; count: number }>;
  unitLevel: Array<{ reason: string; count: number }>;
}

export interface DeferralReasonDto {
  reason: string;
  count: number;
}

export interface StockOverviewDto {
  totals: {
    donors: number;
    donations: number;
    inStock: number;
    reserved: number;
    issued: number;
    discarded: number;
    transfusions: number;
  };
  stockMatrix: Array<{ componentType: string; bloodGroup: string; rh: string; count: number }>;
}

const LEGACY_COMPONENT_LABEL: Record<string, string> = {
  PRBC: 'RBC',
  PLATELET_CONCENTRATE: 'Platelet',
  CRYOPRECIPITATE: 'Cryo',
  FFP: 'FFP',
};

export interface OngoingCampDto {
  id: string;
  campId: string;
  name: string;
  address: string;
  dateFrom: string;
  dateTo: string;
  staff: string[];
  donorsCount: number;
  unitsCount: number;
}

export interface LegacyOverviewDto {
  donorDonation: {
    donors: number;
    newDonors: number;
    donations: number;
    donationsInHouse: number;
    donationsCamp: number;
    maleDonors: number;
    femaleDonors: number;
    otherDonors: number;
    firstTimeDonors: number;
    repeatDonors: number;
  };
  bloodBags: {
    bagsCollected: number;
    bagsTested: number;
    bagsPassed: number;
    bagsFailed: number;
    bagsPending: number;
    bagsQuarantined: number;
  };
  components: {
    componentsProduced: number;
    rbcProduced: number;
    pltProduced: number;
    ffpProduced: number;
    cryoProduced: number;
  };
  inventory: {
    inStock: number;
    reserved: number;
    issued: number;
    discarded: number;
    nearExpiryTotal: number;
    expiredUnits: number;
  };
  bloodGroups: {
    Opos: number; Oneg: number; Apos: number; Aneg: number;
    Bpos: number; Bneg: number; ABpos: number; ABneg: number;
  };
  componentAvailability: {
    rbcStock: number; pltStock: number; ffpStock: number; cryoStock: number;
  };
  hospitalRequests: {
    totalRequests: number;
    pendingRequests: number;
    matchedRequests: number;
    approvedRequests: number;
    issuedRequests: number;
    completedRequests: number;
    rejectedRequests: number;
    totalUnitsRequested: number;
  };
  testingSerology: {
    testsTotal: number;
    hivPos: number;
    hbvPos: number;
    hcvPos: number;
    vdrlPos: number;
    mpPos: number;
  };
  camps: {
    campsConducted: number;
    campDonors: number;
    campCollections: number;
    campFailures: number;
  };
  alerts: {
    expiringToday: number;
    testsPending: number;
    delayedTesting: number;
    missingExpiry: number;
    inactiveDonors: number;
  };
  ongoingCamps: OngoingCampDto[];
  nearExpiryByComponent: Array<{ componentType: string; value: number }>;
  bloodbagStatusPie: Array<{ status: string; value: number }>;
}

export interface DonorCardSectionDto {
  totalCount: number;
  breakdown: Array<{ componentType: string; bloodGroup: string; rh: string; count: number }>;
}

export interface HospitalRequisitionDto {
  hospitalId: string;
  hospitalName: string;
  totalRequests: number;
  totalUnits: number;
}

export type AlertType = 'CHEMICAL_LOW_STOCK' | 'BAG_BOX_LOW_STOCK';
export type AlertSeverity = 'warning' | 'critical';

export interface AlertDto {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  entityId: string;
  currentValue: number;
  threshold: number;
  link: '/chemical-inventory/usage' | '/procurement/inventory';
}

function campToDto(raw: any): CampSummaryDto {
  return {
    id: raw._id.toString(),
    campId: raw.campId,
    name: raw.name,
    address: raw.address,
    dateFrom: raw.dateFrom ? new Date(raw.dateFrom).toISOString() : '',
    dateTo: raw.dateTo ? new Date(raw.dateTo).toISOString() : '',
    staffCount: Array.isArray(raw.staff) ? raw.staff.length : 0,
  };
}

export interface DashboardRepo {
  stockOverview(): Promise<StockOverviewDto>;
  legacyOverview(): Promise<LegacyOverviewDto>;
  requisitionsByHospital(): Promise<HospitalRequisitionDto[]>;
  donorCardSummary(): Promise<DonorCardSectionDto>;
  campOverview(): Promise<CampOverviewDto>;
  chemicalStock(): Promise<any>;
  bagStock(): Promise<BagStockSectionDto>;
  bulkTransferSummary(): Promise<BulkTransferSectionDto>;
  diseaseSummary(): Promise<DiseaseSectionDto>;
  storageBreakdown(): Promise<StorageBreakdownItemDto[]>;
  discardSummary(): Promise<DiscardSectionDto>;
  deferralReasonBreakdown(): Promise<DeferralReasonDto[]>;
  lowStockAlerts(): Promise<AlertDto[]>;
}

export function createDashboardRepo(deps: {
  chemicalInventory: ChemicalInventoryRepo;
  bagStock: BagStockRepo;
  bulkTransfer: BulkTransferRepo;
}): DashboardRepo {
  return {
    async stockOverview() {
      const [donors, donations, inStock, reserved, issued, discarded, transfusions, matrixAgg] = await Promise.all([
        DonorModel.countDocuments({ deletedAt: null }),
        DonationModel.countDocuments({ deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'RELEASED', deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'RESERVED', deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'ISSUED', deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'DISCARDED', deletedAt: null }),
        TransfusionModel.countDocuments({}),
        BloodUnitModel.aggregate([
          { $match: { status: 'RELEASED', deletedAt: null } },
          {
            $group: {
              _id: { componentType: '$componentType', bloodGroup: '$aboGroup', rhFactor: '$rhFactor' },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const stockMatrix = matrixAgg.map((r: any) => ({
        componentType: LEGACY_COMPONENT_LABEL[r._id.componentType] ?? r._id.componentType,
        bloodGroup: r._id.bloodGroup,
        rh: r._id.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
        count: r.count,
      }));

      return {
        totals: { donors, donations, inStock, reserved, issued, discarded, transfusions },
        stockMatrix,
      };
    },

    async legacyOverview() {
      const now = new Date();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [
        donorsTotal,
        donorsNew,
        maleDonors,
        femaleDonors,
        otherDonors,
        inactiveDonors,
        donations,
        donationsInHouse,
        donationsCamp,
        componentsProducedAgg,
        campsConducted,
        expiringToday,
        testsPending,
        delayedTesting,
        missingExpiry,
        stockByGroupAgg,
        stockByComponentAgg,
        nearExpiryAgg,
        requestsByStatusAgg,
        totalUnitsRequestedAgg,
        campDonorsList,
        campDonationIds,
        transfusions,
        positivityAgg,
        bloodUnitStatusAgg,
        issuedTotal,
        discardedTotal,
        inStockTotal,
        reservedTotal,
        bagsPassed,
        bagsFailed,
        bagsPending,
        bagsQuarantined,
        donorDonationCounts,
      ] = await Promise.all([
        DonorModel.countDocuments({ deletedAt: null }),
        DonorModel.countDocuments({ deletedAt: null, createdAt: { $gte: thirtyDaysAgo } }),
        DonorModel.countDocuments({ sex: 'M', deletedAt: null }),
        DonorModel.countDocuments({ sex: 'F', deletedAt: null }),
        DonorModel.countDocuments({ sex: 'O', deletedAt: null }),
        DonorModel.countDocuments({
          deletedAt: null,
          $or: [{ lastDonationDate: { $lt: sixMonthsAgo } }, { lastDonationDate: null }, { lastDonationDate: { $exists: false } }],
        }),
        DonationModel.countDocuments({ deletedAt: null }),
        DonationModel.countDocuments({ campId: null, deletedAt: null }),
        DonationModel.countDocuments({ campId: { $ne: null }, deletedAt: null }),
        BloodUnitModel.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: '$componentType', count: { $sum: 1 } } },
        ]),
        CampModel.countDocuments({}),
        BloodUnitModel.countDocuments({
          status: 'RELEASED',
          expiresAt: { $gte: startOfToday, $lt: startOfTomorrow },
          deletedAt: null,
        }),
        TtiResultModel.countDocuments({ releaseDecision: 'pending' }),
        TtiResultModel.countDocuments({ releaseDecision: 'pending', createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        BloodUnitModel.countDocuments({ status: 'RELEASED', expiresAt: null, deletedAt: null }),
        BloodUnitModel.aggregate([
          { $match: { status: 'RELEASED', deletedAt: null } },
          { $group: { _id: { bloodGroup: '$aboGroup', rhFactor: '$rhFactor' }, count: { $sum: 1 } } },
        ]),
        BloodUnitModel.aggregate([
          { $match: { status: 'RELEASED', deletedAt: null } },
          { $group: { _id: '$componentType', count: { $sum: 1 } } },
        ]),
        BloodUnitModel.aggregate([
          { $match: { status: 'RELEASED', expiresAt: { $ne: null }, deletedAt: null } },
          {
            $addFields: {
              daysToExpiry: { $ceil: { $divide: [{ $subtract: ['$expiresAt', now] }, 86400000] } },
              threshold: {
                $switch: {
                  branches: [
                    { case: { $in: ['$componentType', ['PLATELET_CONCENTRATE', 'SDP']] }, then: 1 },
                    { case: { $in: ['$componentType', ['PRBC', 'IRRADIATED_PRBC', 'WASHED_PRBC', 'LEUKOREDUCED_PRBC']] }, then: 7 },
                    { case: { $eq: ['$componentType', 'FFP'] }, then: 30 },
                    { case: { $eq: ['$componentType', 'CRYOPRECIPITATE'] }, then: 30 },
                  ],
                  default: 7,
                },
              },
            },
          },
          { $match: { $expr: { $and: [{ $gte: ['$daysToExpiry', 0] }, { $lte: ['$daysToExpiry', '$threshold'] }] } } },
          { $group: { _id: '$componentType', count: { $sum: 1 } } },
        ]),
        RequisitionModel.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        RequisitionModel.aggregate([
          { $match: { deletedAt: null } },
          { $unwind: '$requestedComponents' },
          { $group: { _id: null, units: { $sum: '$requestedComponents.units' } } },
        ]),
        DonationModel.find({ campId: { $ne: null }, deletedAt: null }).distinct('donor'),
        DonationModel.find({ campId: { $ne: null }, deletedAt: null }).distinct('donationId'),
        TransfusionModel.countDocuments({}),
        TtiResultModel.aggregate([
          { $unwind: '$tests' },
          { $group: { _id: { test: '$tests.testName', result: '$tests.result' }, count: { $sum: 1 } } },
        ]),
        BloodUnitModel.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        BloodUnitModel.countDocuments({ status: 'ISSUED', deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'DISCARDED', deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'RELEASED', deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'RESERVED', deletedAt: null }),
        TtiResultModel.countDocuments({ releaseDecision: 'released' }),
        TtiResultModel.countDocuments({ releaseDecision: 'reactive' }),
        TtiResultModel.countDocuments({ releaseDecision: 'pending' }),
        TtiResultModel.countDocuments({ releaseDecision: 'on-hold' }),
        DonationModel.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: '$donor', count: { $sum: 1 } } },
        ]),
      ]);

      let firstTimeDonors = 0;
      let repeatDonors = 0;
      donorDonationCounts.forEach((d: any) => {
        if (d.count === 1) firstTimeDonors++;
        else if (d.count > 1) repeatDonors++;
      });

      const componentProducedMap = componentsProducedAgg.reduce((acc: any, x: any) => {
        acc[LEGACY_COMPONENT_LABEL[x._id] ?? x._id] = x.count || 0;
        return acc;
      }, {});
      const componentsProducedTotal = componentsProducedAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);

      const stockByGroupMap: Record<string, number> = {};
      stockByGroupAgg.forEach((x: any) => {
        const bg = x._id?.bloodGroup || 'Unknown';
        const rh = x._id?.rhFactor === 'NEGATIVE' ? 'Negative' : 'Positive';
        stockByGroupMap[`${bg}|${rh}`] = x.count || 0;
      });
      const stockFor = (group: string, rh: string) => stockByGroupMap[`${group}|${rh}`] || 0;

      const componentStockMap = stockByComponentAgg.reduce((acc: any, x: any) => {
        acc[LEGACY_COMPONENT_LABEL[x._id] ?? x._id] = x.count || 0;
        return acc;
      }, {});

      const nearExpiryByComponent = nearExpiryAgg.map((x: any) => ({
        componentType: LEGACY_COMPONENT_LABEL[x._id] ?? x._id,
        value: x.count,
      }));
      const nearExpiryTotal = nearExpiryAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);

      const requestsStatusMap = requestsByStatusAgg.reduce((acc: any, x: any) => {
        acc[(x._id || 'unknown').toLowerCase()] = x.count || 0;
        return acc;
      }, {});
      const totalRequests = requestsByStatusAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);
      const totalUnitsRequested = totalUnitsRequestedAgg?.[0]?.units || 0;

      const campFailures = await TtiResultModel.countDocuments({
        donationId: { $in: campDonationIds },
        releaseDecision: 'reactive',
      });

      const positivity: Record<string, { Reactive: number; Negative: number; Shadeness: number }> = {};
      positivityAgg.forEach((x: any) => {
        let testKey = x._id?.test || 'Unknown';
        if (testKey === 'HBSAG') testKey = 'HBsAg';
        else if (testKey === 'SYPHILIS') testKey = 'VDRL';
        else if (testKey === 'MALARIA') testKey = 'MP';

        let resultKey = x._id?.result || 'Unknown';
        if (resultKey === 'NEGATIVE') resultKey = 'Negative';
        else if (resultKey === 'REACTIVE') resultKey = 'Reactive';
        else if (resultKey === 'INDETERMINATE') resultKey = 'Shadeness';

        if (!positivity[testKey]) positivity[testKey] = { Reactive: 0, Negative: 0, Shadeness: 0 };
        const entry = positivity[testKey];
        if (!entry) return;
        if (resultKey === 'Reactive') entry.Reactive += x.count;
        else if (resultKey === 'Negative') entry.Negative += x.count;
        else if (resultKey === 'Shadeness') entry.Shadeness += x.count;
      });
      const testsTotal = positivityAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);

      const statusPieMap: Record<string, number> = {
        collected: 0, 'component-separated': 0, testing: 0, passed: 0, failed: 0, quarantined: 0, issued: 0, discarded: 0,
      };
      bloodUnitStatusAgg.forEach((x: any) => {
        const status = x._id;
        if (status === 'COLLECTED') statusPieMap.collected += x.count;
        else if (status === 'IN_TESTING') statusPieMap.testing += x.count;
        else if (status === 'QUARANTINE') statusPieMap.quarantined += x.count;
        else if (['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(status)) statusPieMap.passed += x.count;
        else if (['ISSUED', 'TRANSFUSED'].includes(status)) statusPieMap.issued += x.count;
        else if (['DISCARDED', 'EXPIRED'].includes(status)) statusPieMap.discarded += x.count;
      });
      const bloodbagStatusPie = Object.entries(statusPieMap).map(([status, value]) => ({ status, value }));

      const ongoingCampsRaw = await CampModel.find({ dateFrom: { $lte: now }, dateTo: { $gte: now } })
        .populate('staff', 'name')
        .lean();
      const ongoingCamps: OngoingCampDto[] = ongoingCampsRaw.map((c: any) => ({
        id: c._id.toString(),
        campId: c.campId,
        name: c.name,
        address: c.address,
        dateFrom: c.dateFrom.toISOString(),
        dateTo: c.dateTo.toISOString(),
        staff: (c.staff || []).map((s: any) => (s ? `${s.name?.first || ''} ${s.name?.last || ''}`.trim() : '')).filter(Boolean),
        donorsCount: c.donorData?.length || 0,
        unitsCount: c.unitData?.length || 0,
      }));

      return {
        donorDonation: {
          donors: donorsTotal,
          newDonors: donorsNew,
          donations,
          donationsInHouse,
          donationsCamp,
          maleDonors,
          femaleDonors,
          otherDonors,
          firstTimeDonors,
          repeatDonors,
        },
        bloodBags: {
          bagsCollected: donations,
          bagsTested: testsTotal,
          bagsPassed,
          bagsFailed,
          bagsPending,
          bagsQuarantined,
        },
        components: {
          componentsProduced: componentsProducedTotal,
          rbcProduced: componentProducedMap.RBC || 0,
          pltProduced: componentProducedMap.Platelet || 0,
          ffpProduced: componentProducedMap.FFP || 0,
          cryoProduced: componentProducedMap.Cryo || 0,
        },
        inventory: {
          inStock: inStockTotal,
          reserved: reservedTotal,
          issued: issuedTotal,
          discarded: discardedTotal,
          nearExpiryTotal,
          expiredUnits: 0,
        },
        bloodGroups: {
          Opos: stockFor('O', 'Positive'),
          Oneg: stockFor('O', 'Negative'),
          Apos: stockFor('A', 'Positive'),
          Aneg: stockFor('A', 'Negative'),
          Bpos: stockFor('B', 'Positive'),
          Bneg: stockFor('B', 'Negative'),
          ABpos: stockFor('AB', 'Positive'),
          ABneg: stockFor('AB', 'Negative'),
        },
        componentAvailability: {
          rbcStock: componentStockMap.RBC || 0,
          pltStock: componentStockMap.Platelet || 0,
          ffpStock: componentStockMap.FFP || 0,
          cryoStock: componentStockMap.Cryo || 0,
        },
        hospitalRequests: {
          totalRequests,
          pendingRequests: requestsStatusMap.pending || 0,
          matchedRequests: requestsStatusMap.matched || 0,
          approvedRequests: requestsStatusMap.approved || 0,
          issuedRequests: requestsStatusMap.issued || 0,
          completedRequests: requestsStatusMap.completed || 0,
          rejectedRequests: requestsStatusMap.rejected || 0,
          totalUnitsRequested,
        },
        testingSerology: {
          testsTotal,
          hivPos: positivity.HIV?.Reactive || 0,
          hbvPos: positivity.HBsAg?.Reactive || 0,
          hcvPos: positivity.HCV?.Reactive || 0,
          vdrlPos: positivity.VDRL?.Reactive || 0,
          mpPos: positivity.MP?.Reactive || 0,
        },
        camps: {
          campsConducted,
          campDonors: campDonorsList.length,
          campCollections: campDonationIds.length,
          campFailures,
        },
        alerts: {
          expiringToday,
          testsPending,
          delayedTesting,
          missingExpiry,
          inactiveDonors,
        },
        ongoingCamps,
        nearExpiryByComponent,
        bloodbagStatusPie,
      };
    },

    async requisitionsByHospital() {
      const rows = await RequisitionModel.aggregate([
        { $match: { deletedAt: null } },
        { $unwind: { path: '$requestedComponents', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$hospitalId',
            totalRequests: { $addToSet: '$_id' },
            totalUnits: { $sum: { $ifNull: ['$requestedComponents.units', 0] } },
          },
        },
        {
          $lookup: { from: 'hospitals', localField: '_id', foreignField: '_id', as: 'hospital' },
        },
        { $unwind: '$hospital' },
        {
          $project: {
            hospitalId: '$_id',
            hospitalName: '$hospital.name',
            totalRequests: { $size: '$totalRequests' },
            totalUnits: 1,
          },
        },
        { $sort: { totalRequests: -1 } },
      ]);
      return rows.map((r: any) => ({
        hospitalId: r.hospitalId.toString(),
        hospitalName: r.hospitalName,
        totalRequests: r.totalRequests,
        totalUnits: r.totalUnits,
      }));
    },

    async donorCardSummary() {
      const cards = await DonorCardModel.find().select('requisitionId').lean();
      const totalCount = cards.length;
      if (totalCount === 0) return { totalCount: 0, breakdown: [] };

      const requisitionIds = cards.map((c) => c.requisitionId);
      const issues = await IssueModel.find({ requisitionId: { $in: requisitionIds } }).select('unitId').lean();
      const unitIds = issues.map((i) => i.unitId);
      if (unitIds.length === 0) return { totalCount, breakdown: [] };

      const rows = await BloodUnitModel.aggregate([
        { $match: { unitId: { $in: unitIds } } },
        {
          $group: {
            _id: { componentType: '$componentType', bloodGroup: '$aboGroup', rhFactor: '$rhFactor' },
            count: { $sum: 1 },
          },
        },
      ]);

      const breakdown = rows.map((r: any) => ({
        componentType: LEGACY_COMPONENT_LABEL[r._id.componentType] ?? r._id.componentType,
        bloodGroup: r._id.bloodGroup,
        rh: r._id.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
        count: r.count,
      }));

      return { totalCount, breakdown };
    },

    async campOverview() {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const camps = await CampModel.find()
        .select('campId name address dateFrom dateTo staff')
        .lean();

      const upcoming: CampSummaryDto[] = [];
      const ongoing: CampSummaryDto[] = [];
      const completedLast30Days: CampSummaryDto[] = [];

      for (const camp of camps) {
        const dateFrom = new Date(camp.dateFrom as unknown as string);
        const dateTo = new Date(camp.dateTo as unknown as string);
        if (dateFrom > now) upcoming.push(campToDto(camp));
        else if (dateFrom <= now && now <= dateTo) ongoing.push(campToDto(camp));
        else if (dateTo < now && dateTo >= monthAgo) completedLast30Days.push(campToDto(camp));
      }

      upcoming.sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
      completedLast30Days.sort((a, b) => new Date(b.dateTo).getTime() - new Date(a.dateTo).getTime());

      return { upcoming, ongoing, completedLast30Days };
    },

    async chemicalStock() {
      return deps.chemicalInventory.getDashboardStats();
    },

    async bagStock() {
      const [byType, lowBoxBatches] = await Promise.all([
        deps.bagStock.summary(),
        deps.bagStock.lowBoxStock(LOW_BOX_THRESHOLD),
      ]);
      return { byType, lowBoxBatches };
    },

    async bulkTransferSummary() {
      const [given, taken] = await Promise.all([
        deps.bulkTransfer.list({ transferType: 'GIVE_LOAN', page: 1, limit: 10 } as any),
        deps.bulkTransfer.list({ transferType: 'TAKE_LOAN', page: 1, limit: 10 } as any),
      ]);
      return {
        given: { total: given.total, recent: given.items },
        taken: { total: taken.total, recent: taken.items },
      };
    },

    async diseaseSummary() {
      const match = {
        deletedAt: null,
        'clinicalIndicationPatient.firstName': { $exists: true, $nin: [null, ''] },
      };

      const rows = await BloodUnitModel.aggregate([
        { $match: match },
        {
          $project: {
            disease: { $ifNull: ['$clinicalIndicationPatient.disease', 'OTHER'] },
            bloodGroup: { $ifNull: ['$clinicalIndicationPatient.bloodGroup', 'Unknown'] },
            fullName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$clinicalIndicationPatient.firstName', ''] },
                    ' ',
                    { $ifNull: ['$clinicalIndicationPatient.middleName', ''] },
                    ' ',
                    { $ifNull: ['$clinicalIndicationPatient.lastName', ''] },
                  ],
                },
              },
            },
          },
        },
      ]);

      type Bucket = { count: number; byBloodGroup: Map<string, number>; patients: Map<string, number> };
      const buckets: Record<'THALASSEMIA' | 'SICKLE_CELL_ANAEMIA' | 'OTHER', Bucket> = {
        THALASSEMIA: { count: 0, byBloodGroup: new Map(), patients: new Map() },
        SICKLE_CELL_ANAEMIA: { count: 0, byBloodGroup: new Map(), patients: new Map() },
        OTHER: { count: 0, byBloodGroup: new Map(), patients: new Map() },
      };

      for (const r of rows as any[]) {
        const key: keyof typeof buckets = r.disease === 'THALASSEMIA' || r.disease === 'SICKLE_CELL_ANAEMIA' ? r.disease : 'OTHER';
        const bucket = buckets[key];
        bucket.count += 1;
        bucket.byBloodGroup.set(r.bloodGroup, (bucket.byBloodGroup.get(r.bloodGroup) ?? 0) + 1);
        bucket.patients.set(r.fullName, (bucket.patients.get(r.fullName) ?? 0) + 1);
      }

      const toDto = (b: Bucket): DiseaseBucketDto => ({
        unitsIssuedCount: b.count,
        byBloodGroup: [...b.byBloodGroup.entries()].map(([bloodGroup, count]) => ({ bloodGroup, count })),
        patients: [...b.patients.entries()]
          .map(([name, unitsIssued]) => ({ name, unitsIssued }))
          .sort((a, b2) => b2.unitsIssued - a.unitsIssued),
      });

      return {
        thalassemia: toDto(buckets.THALASSEMIA),
        sickleCellAnaemia: toDto(buckets.SICKLE_CELL_ANAEMIA),
        other: toDto(buckets.OTHER),
      };
    },

    async storageBreakdown() {
      const rows = await BloodUnitModel.aggregate([
        { $match: { storageLocation: { $ne: null }, deletedAt: null } },
        { $group: { _id: '$storageLocation', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      return rows.map((r: any) => ({ location: r._id, count: r.count }));
    },

    async discardSummary() {
      const [bagLevel, unitLevel] = await Promise.all([
        BagDiscardModel.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: '$reason', quantity: { $sum: '$quantity' }, count: { $sum: 1 } } },
          { $sort: { quantity: -1 } },
        ]),
        BloodUnitModel.aggregate([
          { $match: { status: 'DISCARDED', deletedAt: null } },
          { $group: { _id: '$discardReason', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);
      return {
        bagLevel: bagLevel.map((r: any) => ({ reason: r._id ?? 'UNSPECIFIED', quantity: r.quantity, count: r.count })),
        unitLevel: unitLevel.map((r: any) => ({ reason: r._id ?? 'UNSPECIFIED', count: r.count })),
      };
    },

    async deferralReasonBreakdown() {
      const rows = await DeferralModel.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      return rows.map((r: any) => ({ reason: r._id ?? 'UNSPECIFIED', count: r.count }));
    },

    async lowStockAlerts() {
      const [chemStats, lowBoxes] = await Promise.all([
        deps.chemicalInventory.getDashboardStats(),
        deps.bagStock.lowBoxStock(LOW_BOX_THRESHOLD),
      ]);

      const alerts: AlertDto[] = [];

      for (const item of chemStats.lowStockItems ?? []) {
        alerts.push({
          type: 'CHEMICAL_LOW_STOCK',
          severity: item.available <= 0 ? 'critical' : 'warning',
          message: `Chemical '${item.name}' low stock: ${item.available} available (reorder level ${item.reorderLevel})`,
          entityId: item.chemicalId,
          currentValue: item.available,
          threshold: item.reorderLevel,
          link: '/chemical-inventory/usage',
        });
      }

      for (const batch of lowBoxes) {
        alerts.push({
          type: 'BAG_BOX_LOW_STOCK',
          severity: batch.unopenedBoxes <= 0 ? 'critical' : 'warning',
          message: `Bag batch ${batch.batchNumber} (${batch.bagType}) low: ${batch.unopenedBoxes} box(es) left`,
          entityId: batch.stockId,
          currentValue: batch.unopenedBoxes,
          threshold: LOW_BOX_THRESHOLD,
          link: '/procurement/inventory',
        });
      }

      alerts.sort((a, b) => {
        if (a.severity === b.severity) return 0;
        return a.severity === 'critical' ? -1 : 1;
      });

      return alerts;
    },
  };
}
