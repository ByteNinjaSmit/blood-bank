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
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import type { ChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import type {
  BagStockRepo,
  BagStockSummaryItem,
  LowBoxBatchDto,
} from '@/modules/bag-stock/bag-stock.repository';
import type {
  BulkTransferRepo,
  BulkTransferDto,
} from '@/modules/bulk-transfer/bulk-transfer.repository';
import { buildDateQuery, campToDto } from './dashboard.types';
import { legacyOverview } from './dashboard.legacy-overview';
import type {
  CampSummaryDto,
  CampOverviewDto,
  BagStockSectionDto,
  BulkTransferSectionDto,
  DiseaseBucketDto,
  DiseaseSectionDto,
  StorageBreakdownItemDto,
  DiscardSectionDto,
  DeferralReasonDto,
  StockOverviewDto,
  OngoingCampDto,
  LegacyOverviewDto,
  DonorCardSectionDto,
  HospitalRequisitionDto,
  AlertType,
  AlertSeverity,
  AlertDto,
} from './dashboard.types';

// Re-exported so existing consumers (dashboard.service) keep their imports.
export type {
  CampSummaryDto,
  CampOverviewDto,
  BagStockSectionDto,
  BulkTransferSectionDto,
  DiseaseBucketDto,
  DiseaseSectionDto,
  StorageBreakdownItemDto,
  DiscardSectionDto,
  DeferralReasonDto,
  StockOverviewDto,
  OngoingCampDto,
  LegacyOverviewDto,
  DonorCardSectionDto,
  HospitalRequisitionDto,
  AlertType,
  AlertSeverity,
  AlertDto,
} from './dashboard.types';

const LOW_BOX_THRESHOLD = 3;

export interface DashboardRepo {
  stockOverview(fromDate?: Date, toDate?: Date): Promise<StockOverviewDto>;
  legacyOverview(fromDate?: Date, toDate?: Date): Promise<LegacyOverviewDto>;
  requisitionsByHospital(fromDate?: Date, toDate?: Date): Promise<HospitalRequisitionDto[]>;
  donorCardSummary(fromDate?: Date, toDate?: Date): Promise<DonorCardSectionDto>;
  campOverview(fromDate?: Date, toDate?: Date): Promise<CampOverviewDto>;
  chemicalStock(fromDate?: Date, toDate?: Date): Promise<any>;
  bagStock(fromDate?: Date, toDate?: Date): Promise<BagStockSectionDto>;
  bulkTransferSummary(fromDate?: Date, toDate?: Date): Promise<BulkTransferSectionDto>;
  diseaseSummary(fromDate?: Date, toDate?: Date): Promise<DiseaseSectionDto>;
  storageBreakdown(fromDate?: Date, toDate?: Date): Promise<StorageBreakdownItemDto[]>;
  discardSummary(fromDate?: Date, toDate?: Date): Promise<DiscardSectionDto>;
  deferralReasonBreakdown(fromDate?: Date, toDate?: Date): Promise<DeferralReasonDto[]>;
  lowStockAlerts(): Promise<AlertDto[]>;
}

export function createDashboardRepo(deps: {
  chemicalInventory: ChemicalInventoryRepo;
  bagStock: BagStockRepo;
  bulkTransfer: BulkTransferRepo;
}): DashboardRepo {
  return {
    async stockOverview(fromDate?: Date, toDate?: Date) {
      const matrixMatch: any = { status: 'RELEASED', deletedAt: null };
      if (fromDate || toDate) {
        matrixMatch.collectedAt = {};
        if (fromDate) matrixMatch.collectedAt.$gte = fromDate;
        if (toDate) matrixMatch.collectedAt.$lte = toDate;
      }

      const [
        donors,
        donations,
        inStock,
        reserved,
        issued,
        discarded,
        transfusions,
        matrixAgg,
        loanTransfers,
      ] = await Promise.all([
        DonorModel.countDocuments({
          deletedAt: null,
          ...buildDateQuery('createdAt', fromDate, toDate),
        }),
        DonationModel.countDocuments({
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        }),
        BloodUnitModel.countDocuments({
          status: 'RELEASED',
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        }),
        BloodUnitModel.countDocuments({
          status: 'RESERVED',
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        }),
        BloodUnitModel.countDocuments({
          status: 'ISSUED',
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        }),
        BloodUnitModel.countDocuments({
          status: 'DISCARDED',
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        }),
        TransfusionModel.countDocuments({ ...buildDateQuery('createdAt', fromDate, toDate) }),
        BloodUnitModel.aggregate([
          { $match: matrixMatch },
          {
            $group: {
              _id: {
                componentType: '$componentType',
                bloodGroup: '$aboGroup',
                rhFactor: '$rhFactor',
              },
              count: { $sum: 1 },
            },
          },
        ]),
        BulkTransferModel.find({
          transferType: 'TAKE_LOAN',
          deletedAt: null,
          ...buildDateQuery('transferDate', fromDate, toDate),
        }).lean(),
      ]);

      const stockMatrix = matrixAgg.map((r: any) => ({
        componentType: r._id.componentType,
        bloodGroup: r._id.bloodGroup,
        rh: r._id.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
        count: r.count,
      }));

      // Bags taken on loan from other blood banks — no BloodUnit record,
      // so fold them into the matrix/in-stock totals separately.
      let loanTotal = 0;
      loanTransfers.forEach((t: any) => {
        (t.items || []).forEach((it: any) => {
          loanTotal += 1;
          const rh = it.bloodGroup?.endsWith('-') ? 'Negative' : 'Positive';
          const bloodGroup = (it.bloodGroup || '').replace(/[+-]/, '');
          const existing = stockMatrix.find(
            (m) =>
              m.componentType === it.componentType && m.bloodGroup === bloodGroup && m.rh === rh,
          );
          if (existing) existing.count += 1;
          else stockMatrix.push({ componentType: it.componentType, bloodGroup, rh, count: 1 });
        });
      });

      return {
        totals: {
          donors,
          donations,
          inStock: inStock + loanTotal,
          reserved,
          issued,
          discarded,
          transfusions,
        },
        stockMatrix,
      };
    },

    async legacyOverview(fromDate?: Date, toDate?: Date) {
      return legacyOverview(fromDate, toDate);
    },
    async requisitionsByHospital(fromDate?: Date, toDate?: Date) {
      const rows = await RequisitionModel.aggregate([
        { $match: { deletedAt: null, ...buildDateQuery('createdAt', fromDate, toDate) } },
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

    async donorCardSummary(fromDate?: Date, toDate?: Date) {
      const cards = await DonorCardModel.find(buildDateQuery('createdAt', fromDate, toDate))
        .select('requisitionId')
        .lean();
      const totalCount = cards.length;
      if (totalCount === 0) return { totalCount: 0, breakdown: [] };

      const requisitionIds = cards.map((c) => c.requisitionId);
      const issues = await IssueModel.find({ requisitionId: { $in: requisitionIds } })
        .select('unitId')
        .lean();
      const unitIds = issues.map((i) => i.unitId);
      if (unitIds.length === 0) return { totalCount, breakdown: [] };

      const rows = await BloodUnitModel.aggregate([
        {
          $match: { unitId: { $in: unitIds }, ...buildDateQuery('collectedAt', fromDate, toDate) },
        },
        {
          $group: {
            _id: {
              componentType: '$componentType',
              bloodGroup: '$aboGroup',
              rhFactor: '$rhFactor',
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const breakdown = rows.map((r: any) => ({
        componentType: r._id.componentType,
        bloodGroup: r._id.bloodGroup,
        rh: r._id.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
        count: r.count,
      }));

      return { totalCount, breakdown };
    },

    async campOverview(fromDate?: Date, toDate?: Date) {
      const now = new Date();
      const refDate = toDate || now;
      const monthAgo = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const campFilter = buildDateQuery('dateFrom', fromDate, toDate);
      const camps = await CampModel.find(campFilter)
        .select('campId name address dateFrom dateTo staff')
        .lean();

      const upcoming: CampSummaryDto[] = [];
      const ongoing: CampSummaryDto[] = [];
      const completedLast30Days: CampSummaryDto[] = [];

      for (const camp of camps) {
        const dateFrom = new Date(camp.dateFrom as unknown as string);
        const dateTo = new Date(camp.dateTo as unknown as string);
        if (dateFrom > refDate) upcoming.push(campToDto(camp));
        else if (dateFrom <= refDate && refDate <= dateTo) ongoing.push(campToDto(camp));
        else if (dateTo < refDate && dateTo >= monthAgo) completedLast30Days.push(campToDto(camp));
      }

      upcoming.sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
      completedLast30Days.sort(
        (a, b) => new Date(b.dateTo).getTime() - new Date(a.dateTo).getTime(),
      );

      return { upcoming, ongoing, completedLast30Days };
    },

    async chemicalStock(fromDate?: Date, toDate?: Date) {
      return deps.chemicalInventory.getDashboardStats();
    },

    async bagStock(fromDate?: Date, toDate?: Date) {
      const [byType, lowBoxBatches] = await Promise.all([
        deps.bagStock.summary(),
        deps.bagStock.lowBoxStock(LOW_BOX_THRESHOLD),
      ]);
      return { byType, lowBoxBatches };
    },

    async bulkTransferSummary(fromDate?: Date, toDate?: Date) {
      const [given, taken] = await Promise.all([
        deps.bulkTransfer.list({
          transferType: 'GIVE_LOAN',
          page: 1,
          limit: 10,
          fromDate,
          toDate,
        } as any),
        deps.bulkTransfer.list({
          transferType: 'TAKE_LOAN',
          page: 1,
          limit: 10,
          fromDate,
          toDate,
        } as any),
      ]);
      return {
        given: { total: given.total, recent: given.items },
        taken: { total: taken.total, recent: taken.items },
      };
    },

    async diseaseSummary(fromDate?: Date, toDate?: Date) {
      const match = {
        deletedAt: null,
        'clinicalIndicationPatient.firstName': { $exists: true, $nin: [null, ''] },
        ...buildDateQuery('collectedAt', fromDate, toDate),
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

      type Bucket = {
        count: number;
        byBloodGroup: Map<string, number>;
        patients: Map<string, number>;
      };
      const buckets: Record<'THALASSEMIA' | 'SICKLE_CELL_ANAEMIA' | 'OTHER', Bucket> = {
        THALASSEMIA: { count: 0, byBloodGroup: new Map(), patients: new Map() },
        SICKLE_CELL_ANAEMIA: { count: 0, byBloodGroup: new Map(), patients: new Map() },
        OTHER: { count: 0, byBloodGroup: new Map(), patients: new Map() },
      };

      for (const r of rows as any[]) {
        const key: keyof typeof buckets =
          r.disease === 'THALASSEMIA' || r.disease === 'SICKLE_CELL_ANAEMIA' ? r.disease : 'OTHER';
        const bucket = buckets[key];
        bucket.count += 1;
        bucket.byBloodGroup.set(r.bloodGroup, (bucket.byBloodGroup.get(r.bloodGroup) ?? 0) + 1);
        bucket.patients.set(r.fullName, (bucket.patients.get(r.fullName) ?? 0) + 1);
      }

      const toDto = (b: Bucket): DiseaseBucketDto => ({
        unitsIssuedCount: b.count,
        byBloodGroup: [...b.byBloodGroup.entries()].map(([bloodGroup, count]) => ({
          bloodGroup,
          count,
        })),
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

    async storageBreakdown(fromDate?: Date, toDate?: Date) {
      const rows = await BloodUnitModel.aggregate([
        {
          $match: {
            storageLocation: { $ne: null },
            deletedAt: null,
            ...buildDateQuery('collectedAt', fromDate, toDate),
          },
        },
        { $group: { _id: '$storageLocation', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      return rows.map((r: any) => ({ location: r._id, count: r.count }));
    },

    async discardSummary(fromDate?: Date, toDate?: Date) {
      const [bagLevel, unitLevel] = await Promise.all([
        BagDiscardModel.aggregate([
          { $match: { deletedAt: null, ...buildDateQuery('createdAt', fromDate, toDate) } },
          { $group: { _id: '$reason', quantity: { $sum: '$quantity' }, count: { $sum: 1 } } },
          { $sort: { quantity: -1 } },
        ]),
        BloodUnitModel.aggregate([
          {
            $match: {
              status: 'DISCARDED',
              deletedAt: null,
              ...buildDateQuery('collectedAt', fromDate, toDate),
            },
          },
          { $group: { _id: '$discardReason', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);
      return {
        bagLevel: bagLevel.map((r: any) => ({
          reason: r._id ?? 'UNSPECIFIED',
          quantity: r.quantity,
          count: r.count,
        })),
        unitLevel: unitLevel.map((r: any) => ({ reason: r._id ?? 'UNSPECIFIED', count: r.count })),
      };
    },

    async deferralReasonBreakdown(fromDate?: Date, toDate?: Date) {
      const rows = await DeferralModel.aggregate([
        { $match: buildDateQuery('createdAt', fromDate, toDate) },
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
