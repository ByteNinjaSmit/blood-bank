import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, feedbackApi } from './api';

export const appointmentKeys = {
  all: ['appointment'],
  list: (params) => [...appointmentKeys.all, 'list', params],
  summary: () => [...appointmentKeys.all, 'summary'],
};

export const feedbackKeys = {
  all: ['feedback'],
  list: (params) => [...feedbackKeys.all, 'list', params],
};

export function useFeedbackList(params) {
  return useQuery({
    queryKey: feedbackKeys.list(params),
    queryFn: () => feedbackApi.list(params),
    staleTime: 30_000,
  });
}

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
