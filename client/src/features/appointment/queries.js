import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from './api';

export const appointmentKeys = {
  all: ['appointment'],
  list: (params) => [...appointmentKeys.all, 'list', params],
  summary: () => [...appointmentKeys.all, 'summary'],
};

export function useAppointmentList(params) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentApi.list(params),
    staleTime: 30_000,
  });
}

export function useAppointmentSummary() {
  return useQuery({
    queryKey: appointmentKeys.summary(),
    queryFn: () => appointmentApi.summary(),
    staleTime: 30_000,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => appointmentApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
