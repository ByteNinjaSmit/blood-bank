import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lookbackApi } from './api';

export function useRunLookback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lookbackApi.run,
    onSuccess: () => {
      // Units recalled → inventory changes
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['donor'] });
    },
  });
}
