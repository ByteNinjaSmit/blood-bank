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
