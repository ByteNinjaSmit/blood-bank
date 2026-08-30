import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serologyApi } from "./api";

export function useBatchRecordResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ items, technicianId }) => serologyApi.batchRecordResults(items, technicianId),
    // Recording + finalizing TTI results moves units through the
    // quarantine gate (release / discard) and updates donation timelines —
    // refresh every view that reads unit or donation state.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["component"] });
      qc.invalidateQueries({ queryKey: ["donation"] });
      qc.invalidateQueries({ queryKey: ["discard"] });
    },
  });
}
