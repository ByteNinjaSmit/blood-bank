import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campApi } from './api';

export const campKeys = {
  all: ['camp'],
  list: (filters) => ['camp', 'list', filters ?? {}],
  detail: (id) => ['camp', 'detail', id],
  staffList: () => ['camp', 'staff-list'],
  donations: (campId) => ['camp', 'donations', campId],
  donors: (campId) => ['camp', 'donors', campId],
  voluntary: (params) => ['camp', 'voluntary', params ?? {}],
};

export function useCampList(filters) {
  return useQuery({
    queryKey: campKeys.list(filters),
    queryFn: () => campApi.list(filters),
    staleTime: 60_000,
  });
}

export function useCampDetail(id) {
  return useQuery({
    queryKey: campKeys.detail(id),
    queryFn: () => campApi.detail(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useStaffList() {
  return useQuery({
    queryKey: campKeys.staffList(),
    queryFn: campApi.staffList,
    staleTime: 5 * 60_000,
  });
}

export function useCampDonations(campId) {
  return useQuery({
    queryKey: campKeys.donations(campId),
    queryFn: () => campApi.campDonations(campId),
    enabled: Boolean(campId),
  });
}

export function useCampDonors(campId) {
  return useQuery({
    queryKey: campKeys.donors(campId),
    queryFn: () => campApi.campDonors(campId),
    enabled: Boolean(campId),
  });
}

export function useVoluntaryDonations(params) {
  return useQuery({
    queryKey: campKeys.voluntary(params),
    queryFn: () => campApi.voluntaryDonations(params),
    staleTime: 30_000,
  });
}

export function useCreateCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: campApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: campKeys.all }),
  });
}

export function useUpdateCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, editReason }) => campApi.update(id, data, editReason),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: campKeys.all });
      qc.invalidateQueries({ queryKey: campKeys.detail(id) });
    },
  });
}

export function useDeleteCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => campApi.remove(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: campKeys.all }),
  });
}

export function useRestoreCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: campApi.restore,
    onSuccess: () => qc.invalidateQueries({ queryKey: campKeys.all }),
  });
}

// Camp has no dedicated /permanent route — remove() is a toggle: called
// once on an active camp it soft-deletes, called again on an already
// soft-deleted one it permanently deletes. This hook is that second call,
// used from the Recycle Bin.
export function usePermanentDeleteCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => campApi.remove(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: campKeys.all }),
  });
}
