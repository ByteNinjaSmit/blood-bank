import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { componentApi } from "./api";

export const componentKeys = {
  all: ["component"],
  list: (filters) => ["component", "list", filters ?? {}],
  detail: (id) => ["component", "detail", id],
  bagsToSeparate: () => ["component", "bags-to-separate"],
};

// Separating a component (or completing separation) creates/releases
// BloodUnits and retires the parent whole-blood bag — every view that
// reads unit / stock / donation state must be refreshed.
function invalidateAfterSeparation(qc) {
  qc.invalidateQueries({ queryKey: componentKeys.all });
  qc.invalidateQueries({ queryKey: ["inventory"] });
  qc.invalidateQueries({ queryKey: ["donation"] });
  qc.invalidateQueries({ queryKey: ["discard"] });
}

export function useComponentList(filters, options = {}) {
  return useQuery({
    queryKey: componentKeys.list(filters),
    queryFn: () => componentApi.list(filters),
    staleTime: 15_000,
    ...options,
  });
}

export function useComponentDetail(id, options = {}) {
  return useQuery({
    queryKey: componentKeys.detail(id),
    queryFn: () => componentApi.detail(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useBagsToSeparate(options = {}) {
  return useQuery({
    queryKey: componentKeys.bagsToSeparate(),
    queryFn: () => componentApi.bagsToSeparate(),
    staleTime: 15_000,
    ...options,
  });
}

export function useSeparateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => componentApi.separate(payload),
    onSuccess: () => invalidateAfterSeparation(qc),
  });
}

export function useSeparationCompleted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ donationId, signature }) =>
      componentApi.separationCompleted(donationId, signature),
    onSuccess: () => invalidateAfterSeparation(qc),
  });
}

export function usePatchComponentBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => componentApi.patchBag(id, payload),
    onSuccess: () => invalidateAfterSeparation(qc),
  });
}
