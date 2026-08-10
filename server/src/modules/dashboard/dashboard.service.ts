import { childLogger } from '@/core/logger';
import type { DashboardRepo, AlertDto } from '@/modules/dashboard/dashboard.repository';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

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
  requisitionIndications: Awaited<ReturnType<DashboardRepo['requisitionIndicationSummary']>>;
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

  function raiseStockAlerts(alerts: AlertDto[]): void {
    const dayBucket = new Date().toISOString().slice(0, 10);
    for (const alert of alerts) {
      void notificationCenterService
        .notify({
          title: alert.type === 'CHEMICAL_LOW_STOCK' ? 'Chemical stock low' : 'Blood bag stock low',
          message: alert.message,
          module: 'INVENTORY',
          category: alert.currentValue <= 0 ? 'ZERO_STOCK' : 'LOW_STOCK',
          severity: alert.severity === 'critical' ? 'CRITICAL' : 'WARNING',
          relatedRecordId: alert.entityId,
          relatedRecordType: alert.type,
          actionLink: alert.link,
          dedupeKey: `${alert.type}:${alert.entityId}:${dayBucket}`,
        })
        .catch(() => undefined);
    }
    // Best-effort, non-blocking — no cron involved, this piggybacks on
    // whichever request happens to hit the dashboard.
    notificationCenterService.checkAndCreateStockSummary().catch(() => undefined);
  }

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
        requisitionIndications,
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
        deps.dashboard.requisitionIndicationSummary(fromDate, toDate),
        deps.dashboard.storageBreakdown(fromDate, toDate),
        deps.dashboard.discardSummary(fromDate, toDate),
        deps.dashboard.deferralReasonBreakdown(fromDate, toDate),
        deps.dashboard.lowStockAlerts(),
      ]);

      log.info({ alertCount: alerts.length }, 'dashboard payload generated');
      raiseStockAlerts(alerts);

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
        requisitionIndications,
        storageBreakdown,
        discards,
        deferrals,
        alerts,
        generatedAt: new Date().toISOString(),
      };
    },

    async getAlerts() {
      const alerts = await deps.dashboard.lowStockAlerts();
      raiseStockAlerts(alerts);
      return { alerts };
    },
  };
}
