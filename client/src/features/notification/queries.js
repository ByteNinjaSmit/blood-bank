import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from './api';

export const notificationKeys = {
  all: ['notification'],
  list: (filters) => [...notificationKeys.all, 'list', filters],
  unreadCount: () => [...notificationKeys.all, 'unread-count'],
};

const POLL_INTERVAL = 30_000;

export function useNotificationList(filters = {}) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationApi.list(filters),
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationApi.unreadCount,
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: invalidate,
  });
}

export function useMarkUnread() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id) => notificationApi.markUnread(id),
    onSuccess: invalidate,
  });
}

export function useMarkAllRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: invalidate,
  });
}

export function useClearRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => notificationApi.clearRead(),
    onSuccess: invalidate,
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id) => notificationApi.remove(id),
    onSuccess: invalidate,
  });
}
