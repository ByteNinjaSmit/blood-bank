import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/notification';

export const notificationApi = {
  list: (params) => apiClient.get(V, { params }).then(unwrap),
  unreadCount: () => apiClient.get(`${V}/unread-count`).then(unwrap),
  markRead: (id) => apiClient.patch(`${V}/${id}/read`).then(unwrap),
  markUnread: (id) => apiClient.patch(`${V}/${id}/unread`).then(unwrap),
  markAllRead: () => apiClient.patch(`${V}/mark-all-read`).then(unwrap),
  clearRead: () => apiClient.delete(`${V}/clear-read`).then(unwrap),
  remove: (id) => apiClient.delete(`${V}/${id}`).then(unwrap),
};
