import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/bulk-transfer';

export const bulkTransferApi = {
  list:   (params)              => apiClient.get(V, { params }).then((res) => ({ data: unwrap(res), pagination: res.data?.pagination })),
  get:    (id)                  => apiClient.get(`${V}/${id}`).then(unwrap),
  create: (data)                => apiClient.post(V, data).then(unwrap),
  update: (id, data, editReason) => apiClient.patch(`${V}/${id}`, { ...data, _editReason: editReason }).then(unwrap),
  remove: (id, reason)          => apiClient.delete(`${V}/${id}`, { data: { reason } }).then(unwrap),
};
