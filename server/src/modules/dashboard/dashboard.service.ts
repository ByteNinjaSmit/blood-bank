import { childLogger } from '@/core/logger';
import type { DashboardRepo, AlertDto } from '@/modules/dashboard/dashboard.repository';

export interface DashboardResponseDto {
  stockOverview: Awaited<ReturnType<DashboardRepo['stockOverview']>>;
  legacyOverview: Awaited<ReturnType<DashboardRepo['legacyOverview']>>;
  hospitalRequisitions: Awaited<ReturnType<DashboardRepo['requisitionsByHospital']>>;
  donorCards: Awaited<ReturnType<DashboardRepo['donorCardSummary']>>;
  campOverview: Awaited<ReturnType<DashboardRepo['campOverview']>>;
  chemicalStock: Awaited<ReturnType<DashboardRepo['chemicalStock']>>;
  bagStock: Awaited<ReturnType<DashboardRepo['bagStock']>>;
  bulkTransfer: Awaited<ReturnType<DashboardRepo['bulkTransferSummary']>>;
  diseasePatients: Awaited<ReturnType<DashboardRepo['diseaseSummary']>>;
  storageBreakdown: Awaited<ReturnType<DashboardRepo['storageBreakdown']>>;
  discards: Awaited<ReturnType<DashboardRepo['discardSummary']>>;
  deferrals: Awaited<ReturnType<DashboardRepo['deferralReasonBreakdown']>>;
  alerts: AlertDto[];
  generatedAt: string;
}

export interface DashboardService {
  getFullDashboard(fromDate?: Date, toDate?: Date): Promise<DashboardResponseDto>;
  getAlerts(): Promise<{ alerts: AlertDto[] }>;
}

export function createDashboardService(deps: { dashboard: DashboardRepo }): DashboardService {
  const log = childLogger({ module: 'dashboard-service' });

  return {
    async getFullDashboard(fromDate?: Date, toDate?: Date) {
      const [
        stockOverview,
        legacyOverview,
        hospitalRequisitions,
        donorCards,
        campOverview,
        chemicalStock,
        bagStock,
        bulkTransfer,
        diseasePatients,
        storageBreakdown,
        discards,
        deferrals,
        alerts,
      ] = await Promise.all([
        deps.dashboard.stockOverview(fromDate, toDate),
        deps.dashboard.legacyOverview(fromDate, toDate),
        deps.dashboard.requisitionsByHospital(fromDate, toDate),
        deps.dashboard.donorCardSummary(fromDate, toDate),
        deps.dashboard.campOverview(fromDate, toDate),
        deps.dashboard.chemicalStock(fromDate, toDate),
        deps.dashboard.bagStock(fromDate, toDate),
        deps.dashboard.bulkTransferSummary(fromDate, toDate),
        deps.dashboard.diseaseSummary(fromDate, toDate),
        deps.dashboard.storageBreakdown(fromDate, toDate),
        deps.dashboard.discardSummary(fromDate, toDate),
        deps.dashboard.deferralReasonBreakdown(fromDate, toDate),
        deps.dashboard.lowStockAlerts(),
      ]);

      log.info({ alertCount: alerts.length }, 'dashboard payload generated');

      return {
        stockOverview,
        legacyOverview,
        hospitalRequisitions,
        donorCards,
        campOverview,
        chemicalStock,
        bagStock,
        bulkTransfer,
        diseasePatients,
        storageBreakdown,
        discards,
        deferrals,
        alerts,
        generatedAt: new Date().toISOString(),
      };
    },

    async getAlerts() {
      const alerts = await deps.dashboard.lowStockAlerts();
      return { alerts };
    },
  };
}
