import { useQuery } from '@tanstack/react-query';
import { yearlyReportApi } from './api';

export const yearlyReportKeys = {
  all: ['yearly-report'],
  detail: (year) => [...yearlyReportKeys.all, year],
};

export function useYearlyReport(year) {
  return useQuery({
    queryKey: yearlyReportKeys.detail(year),
    queryFn: () => yearlyReportApi.get(year),
    enabled: Boolean(year),
    staleTime: 60_000,
  });
}
