import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requisitionApi } from './api';

export const requisitionKeys = {
  all: ['requisition'],
  list: (f) => ['requisition', 'list', f ?? {}],
  detail: (id) => ['requisition', 'detail', id],
};

export function useRequisitionList(filters) {
  return useQuery({
    queryKey: requisitionKeys.list(filters),
    queryFn: () => requisitionApi.list(filters),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useRequisitionDetail(id) {
  return useQuery({
    queryKey: requisitionKeys.detail(id),
    queryFn: () => requisitionApi.detail(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

// Patient registration (needed before creating requisition)
export function useCreatePatient() {
  return useMutation({ mutationFn: requisitionApi.createPatient });
}

export function useCreateRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requisitionApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: requisitionKeys.all }),
  });
}

export function useMatchRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => requisitionApi.match(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useApproveRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => requisitionApi.approve(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: requisitionKeys.all });
    },
  });
}

export function useCompleteRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => requisitionApi.complete(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: requisitionKeys.all });
    },
  });
}

export function useRejectRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => requisitionApi.reject(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCrossmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requisitionApi.crossmatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: requisitionKeys.all }),
  });
}

export function useIssueUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requisitionApi.issue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requisitionKeys.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useIssueAllForRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, unitIds }) => requisitionApi.issueAll(id, unitIds),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: requisitionKeys.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useAvailableUnits(id, params) {
  return useQuery({
    queryKey: ['requisition', 'available-units', id, params ?? {}],
    queryFn: () => requisitionApi.availableUnits(id, params),
    enabled: Boolean(id && params?.componentType),
  });
}

export function useSwapMatchedUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => requisitionApi.swapMatchedUnit(id, data),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}

export function useSaveRecipientGrouping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, grouping }) => requisitionApi.setRecipientGrouping(id, grouping),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}

export function useSaveBagGrouping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, unitId, grouping }) => requisitionApi.setMatchedUnitGrouping(id, { unitId, grouping }),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}

export function useConfirmCompatibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, unitId, confirmed }) => requisitionApi.confirmCompatibility(id, { unitId, confirmed }),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}

export function useUpdateCrossmatchLegacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => requisitionApi.updateCrossmatch(id, data),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}

export function useResetCrossmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, unitId }) => requisitionApi.resetCrossmatch(id, unitId),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}

export function useRejectComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, componentType, reason }) => requisitionApi.rejectComponent(id, { componentType, reason }),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: requisitionKeys.detail(id) }),
  });
}
