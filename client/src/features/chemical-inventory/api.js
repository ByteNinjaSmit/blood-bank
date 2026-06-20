import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/chemical-inventory';

export const chemicalInventoryApi = {
  category: {
    list:   ()       => apiClient.get(`${V}/category`).then(unwrap),
    create: (data)   => apiClient.post(`${V}/category`, data).then(unwrap),
    remove: (id)     => apiClient.delete(`${V}/category/${id}`).then(unwrap),
  },

  supplier: {
    list:   ()       => apiClient.get(`${V}/supplier`).then(unwrap),
    create: (data)   => apiClient.post(`${V}/supplier`, data).then(unwrap),
    update: (id, d)  => apiClient.put(`${V}/supplier/${id}`, d).then(unwrap),
    remove: (id)     => apiClient.delete(`${V}/supplier/${id}`).then(unwrap),
  },

  manufacturer: {
    list:   ()       => apiClient.get(`${V}/manufacturer`).then(unwrap),
    create: (data)   => apiClient.post(`${V}/manufacturer`, data).then(unwrap),
    remove: (id)     => apiClient.delete(`${V}/manufacturer/${id}`).then(unwrap),
  },

  chemical: {
    list:   ()       => apiClient.get(`${V}/chemical`).then(unwrap),
    create: (data)   => apiClient.post(`${V}/chemical`, data).then(unwrap),
    update: (id, d)  => apiClient.put(`${V}/chemical/${id}`, d).then(unwrap),
    remove: (id)     => apiClient.delete(`${V}/chemical/${id}`).then(unwrap),
  },

  lot: {
    list:        (params)   => apiClient.get(`${V}/lot`, { params }).then(unwrap),
    create:      (data)     => apiClient.post(`${V}/lot`, data).then(unwrap),
    updateUsage: (id, data) => apiClient.patch(`${V}/lot/${id}/usage`, data).then(unwrap),
  },

  purchase: {
    list:           ()         => apiClient.get(`${V}/purchase`).then(unwrap),
    updatePayments: (id, data) => apiClient.patch(`${V}/purchase/${id}/payments`, data).then(unwrap),
  },

  history: {
    list: (params) => apiClient.get(`${V}/history`, { params }).then(unwrap),
  },

  stats: {
    get: () => apiClient.get(`${V}/dashboard`).then(unwrap),
  },

  reports: {
    monthly:     (params) => apiClient.get(`${V}/reports/monthly`, { params }).then(unwrap),
    supplier:    (params) => apiClient.get(`${V}/reports/supplier`, { params }).then(unwrap),
    expiry:      ()       => apiClient.get(`${V}/reports/expiry`).then(unwrap),
    consumption: ()       => apiClient.get(`${V}/reports/consumption`).then(unwrap),
  },
};
