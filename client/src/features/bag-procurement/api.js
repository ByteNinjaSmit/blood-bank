import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2';

export const bagProcurementApi = {
  vendor: {
    list:         (params)      => apiClient.get(`${V}/vendor`, { params }).then(unwrap),
    get:          (id)          => apiClient.get(`${V}/vendor/${id}`).then(unwrap),
    create:       (data)        => apiClient.post(`${V}/vendor`, data).then(unwrap),
    update:       (id, data)    => apiClient.put(`${V}/vendor/${id}`, data).then(unwrap),
    updateStatus: (id, status)  => apiClient.patch(`${V}/vendor/${id}/status`, { status }).then(unwrap),
    remove:       (id)          => apiClient.delete(`${V}/vendor/${id}`).then(unwrap),
  },

  purchaseOrder: {
    list:    (params)   => apiClient.get(`${V}/purchase-order`, { params }).then(unwrap),
    get:     (id)       => apiClient.get(`${V}/purchase-order/${id}`).then(unwrap),
    create:  (data)     => apiClient.post(`${V}/purchase-order`, data).then(unwrap),
    update:  (id, data) => apiClient.put(`${V}/purchase-order/${id}`, data).then(unwrap),
    submit:  (id)       => apiClient.patch(`${V}/purchase-order/${id}/submit`).then(unwrap),
    approve: (id)       => apiClient.patch(`${V}/purchase-order/${id}/approve`).then(unwrap),
    reject:  (id, data) => apiClient.patch(`${V}/purchase-order/${id}/reject`, data).then(unwrap),
  },

  goodsReceipt: {
    list:   (params)   => apiClient.get(`${V}/goods-receipt`, { params }).then(unwrap),
    get:    (id)       => apiClient.get(`${V}/goods-receipt/${id}`).then(unwrap),
    create: (data)     => apiClient.post(`${V}/goods-receipt`, data).then(unwrap),
    accept: (id)       => apiClient.patch(`${V}/goods-receipt/${id}/accept`).then(unwrap),
  },

  bagStock: {
    list:         (params)        => apiClient.get(`${V}/bag-stock`, { params }).then(unwrap),
    get:          (id)            => apiClient.get(`${V}/bag-stock/${id}`).then(unwrap),
    summary:      ()              => apiClient.get(`${V}/bag-stock/summary`).then(unwrap),
    updateStatus: (id, status)    => apiClient.patch(`${V}/bag-stock/${id}/status`, { status }).then(unwrap),
  },

  bagInspection: {
    list:         (params)   => apiClient.get(`${V}/bag-inspection`, { params }).then(unwrap),
    get:          (id)       => apiClient.get(`${V}/bag-inspection/${id}`).then(unwrap),
    create:       (data)     => apiClient.post(`${V}/bag-inspection`, data).then(unwrap),
    updateReport: (id, data) => apiClient.patch(`${V}/bag-inspection/${id}/report`, data).then(unwrap),
  },

  bagIssue: {
    list:        (params)   => apiClient.get(`${V}/bag-issue`, { params }).then(unwrap),
    get:         (id)       => apiClient.get(`${V}/bag-issue/${id}`).then(unwrap),
    create:      (data)     => apiClient.post(`${V}/bag-issue`, data).then(unwrap),
    markUsed:    (id, data) => apiClient.patch(`${V}/bag-issue/${id}/used`, data).then(unwrap),
    returnBag:   (id)       => apiClient.patch(`${V}/bag-issue/${id}/return`).then(unwrap),
    markDamaged: (id, data) => apiClient.patch(`${V}/bag-issue/${id}/damaged`, data).then(unwrap),
  },

  bagDiscard: {
    list:    (params)   => apiClient.get(`${V}/bag-discard`, { params }).then(unwrap),
    get:     (id)       => apiClient.get(`${V}/bag-discard/${id}`).then(unwrap),
    create:  (data)     => apiClient.post(`${V}/bag-discard`, data).then(unwrap),
    approve: (id, data) => apiClient.patch(`${V}/bag-discard/${id}/approve`, data).then(unwrap),
  },
};
