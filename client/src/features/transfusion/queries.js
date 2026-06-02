import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transfusionApi } from './api';

export function useRecordTransfusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transfusionApi.record,
    onSuccess: () => {
      // Unit status changes to TRANSFUSED/RETURNED_UNUSED
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['requisition'] });
    },
  });
}
