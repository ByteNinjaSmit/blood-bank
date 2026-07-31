import type { MisRepo } from '@/modules/mis/mis.repository';

export function createMisService(repo: MisRepo) {
  return {
    getDonorStats: (fromDate?: Date, toDate?: Date) => repo.getDonorStats(fromDate, toDate),
    getDonationStats: (fromDate?: Date, toDate?: Date) => repo.getDonationStats(fromDate, toDate),
    getCampStats: (fromDate?: Date, toDate?: Date) => repo.getCampStats(fromDate, toDate),
    getBagStats: (fromDate?: Date, toDate?: Date) => repo.getBagStats(fromDate, toDate),
    getComponentStats: (fromDate?: Date, toDate?: Date) => repo.getComponentStats(fromDate, toDate),
    getInventoryStats: () => repo.getInventoryStats(),
    getIssueStats: () => repo.getIssueStats(),
    getDiscardStats: () => repo.getDiscardStats(),
    getSerologyStats: () => repo.getSerologyStats(),
    getAuditStats: () => repo.getAuditStats(),
    getRegulatoryStats: () => repo.getRegulatoryStats(),
    getExecutiveStats: (period: '7d' | '30d' | 'all') => repo.getExecutiveStats(period),
    getAnalyticsStats: () => repo.getAnalyticsStats(),
  };
}

export type MisService = ReturnType<typeof createMisService>;
