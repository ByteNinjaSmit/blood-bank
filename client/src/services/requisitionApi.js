import apiService from './api.js';

class RequisitionApiService {
  constructor() {
    this.baseUrl = '/api/v2/requisition';
  }

  initialize(authToken) {
    apiService.initialize(import.meta.env.VITE_APP_URI_API, authToken);
  }

  _wrap(resp) {
    const { data, error, errorData } = resp;
    if (error) return { success: false, error, data: null, errorData };
    return { success: true, data: data?.data ?? data, raw: data };
  }

  async createRequest(payload) {
    return this._wrap(await apiService.post(`${this.baseUrl}`, payload));
  }

  async listRequests(params = {}) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== null && value !== undefined) {
        cleanParams[key] = value;
      }
    }
    return this._wrap(await apiService.get(`${this.baseUrl}`, cleanParams));
  }

  async getRequest(id) {
    return this._wrap(await apiService.get(`${this.baseUrl}/${id}`));
  }

  async match(id) {
    return this._wrap(await apiService.post(`${this.baseUrl}/${id}/match`, {}));
  }

  async approve(id) {
    return this._wrap(await apiService.post(`${this.baseUrl}/${id}/approve`, {}));
  }

  async issue(id) {
    return this._wrap(await apiService.post(`${this.baseUrl}/${id}/issue`, {}));
  }

  async complete(id) {
    return this._wrap(await apiService.post(`${this.baseUrl}/${id}/complete`, {}));
  }

  async reject(id, reason) {
    return this._wrap(await apiService.post(`${this.baseUrl}/${id}/reject`, { reason }));
  }

  async updateCrossmatch(requestId, { inventoryId, crossmatchStatus }) {
    return this._wrap(
      await apiService.post(`${this.baseUrl}/crossmatch`, {
        requisitionId: requestId,
        unitId: inventoryId,
        method: 'IS',
        result: crossmatchStatus.toUpperCase(),
      })
    );
  }

  async getCompatibilityInfo(componentType, bloodGroup, rh) {
    const params = { componentType };
    if (bloodGroup) params.bloodGroup = bloodGroup;
    if (rh) params.rh = rh;
    return this._wrap(await apiService.get(`${this.baseUrl}/compatibility-info`, params));
  }
}

export default new RequisitionApiService();

