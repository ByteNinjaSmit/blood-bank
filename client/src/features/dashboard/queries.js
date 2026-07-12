import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';

export const dashboardKeys = {
  all: ['dashboard'],
  full: () => [...dashboardKeys.all, 'full'],
  alerts: () => [...dashboardKeys.all, 'alerts'],
};

export function useDashboard(filters) {
  return useQuery({
    queryKey: [...dashboardKeys.full(), filters],
    queryFn: () => dashboardApi.get(filters),
    staleTime: 60_000,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: dashboardApi.getAlerts,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
