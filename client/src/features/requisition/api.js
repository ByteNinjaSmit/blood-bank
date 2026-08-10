import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/requisition';

export const requisitionApi = {
  // Listing and detail
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  // Same as list(), but keeps the pagination envelope — for callers (e.g.
  // the Thalassemia / Sickle Cell Anaemia register) that page through
  // results outside of useRequisitionList's own pagination state.
  listPaged: (params) =>
    apiClient.get(BASE, { params }).then((res) => ({
      items: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination || {},
    })),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),

  // Patient registration (prerequisite for requisition)
  createPatient: (data) => apiClient.post(`${BASE}/patient`, data).then(unwrap),

  // Requisition lifecycle
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/${id}`, data).then(unwrap),
  match: (id) => apiClient.post(`${BASE}/${id}/match`, {}).then(unwrap),
  approve: (id) => apiClient.post(`${BASE}/${id}/approve`, {}).then(unwrap),
  complete: (id) => apiClient.post(`${BASE}/${id}/complete`, {}).then(unwrap),
  reject: (id, data) => apiClient.post(`${BASE}/${id}/reject`, data).then(unwrap),

  // Crossmatch (serology records compatibility result)
  crossmatch: (data) => apiClient.post(`${BASE}/crossmatch`, data).then(unwrap),

  // Issue (unit leaves bank)
  issue: (data) => apiClient.post(`${BASE}/issue`, data).then(unwrap),
  issueAll: (id, unitIds) => apiClient.patch(`${BASE}/${id}/issue`, { unitIds }).then(unwrap),

  // Match Review: bag picking, grouping worksheets, crossmatch sign-off.
  availableUnits: (id, params) => apiClient.get(`${BASE}/${id}/available-units`, { params }).then(unwrap),
  swapMatchedUnit: (id, data) => apiClient.patch(`${BASE}/${id}/matched-unit`, data).then(unwrap),
  setRecipientGrouping: (id, grouping) => apiClient.patch(`${BASE}/${id}/grouping`, grouping).then(unwrap),
  setMatchedUnitGrouping: (id, data) => apiClient.patch(`${BASE}/${id}/matched-unit/grouping`, data).then(unwrap),
  confirmCompatibility: (id, data) =>
    apiClient.patch(`${BASE}/${id}/matched-unit/confirm-compatibility`, data).then(unwrap),
  rejectComponent: (id, data) => apiClient.patch(`${BASE}/${id}/component/reject`, data).then(unwrap),
  // Per-bag crossmatch worksheet (data-only until the unit is reserved on
  // approve — see requisition.service.ts updateCrossmatchLegacy).
  updateCrossmatch: (id, data) => apiClient.patch(`${BASE}/${id}/crossmatch`, data).then(unwrap),
  resetCrossmatch: (id, unitId) =>
    apiClient.patch(`${BASE}/${id}/crossmatch`, { inventoryId: unitId, crossmatchStatus: 'pending' }).then(unwrap),
};
