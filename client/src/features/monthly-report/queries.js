import { useQuery } from '@tanstack/react-query';
import { monthlyReportApi } from './api';

export const monthlyReportKeys = {
  all: ['monthly-report'],
  detail: (month, year) => [...monthlyReportKeys.all, month, year],
};

export function useMonthlyReport(month, year) {
  return useQuery({
    queryKey: monthlyReportKeys.detail(month, year),
    queryFn: () => monthlyReportApi.get(month, year),
    enabled: Boolean(month) && Boolean(year),
    staleTime: 60_000,
  });
}
