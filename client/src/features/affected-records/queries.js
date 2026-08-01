import { useQuery } from '@tanstack/react-query';
import { affectedRecordsApi } from './api';

export function useAffectedRecords() {
  return useQuery({
    queryKey: ['affected-records'],
    queryFn: () => affectedRecordsApi.list(),
    staleTime: 30_000,
  });
}
