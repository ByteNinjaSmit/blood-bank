import { useMutation } from "@tanstack/react-query";
import { serologyApi } from "./api";

export function useBatchRecordResults() {
  return useMutation({
    mutationFn: ({ items, technicianId }) => serologyApi.batchRecordResults(items, technicianId),
  });
}
