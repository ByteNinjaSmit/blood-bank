import apiService from './api.js';

class RequisitionApiService {
  constructor() {
    this.baseUrl = '/api/requests';
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
    return this._wrap(await apiService.get(`${this.baseUrl}`, params));
  }

  async getRequest(id) {
    return this._wrap(await apiService.get(`${this.baseUrl}/${id}`));
  }

  async match(id) {
    return this._wrap(await apiService.post(`${this.baseUrl}/${id}/match`, {}));
  }

  async approve(id) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/approve`, {}));
  }

  async issue(id) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/issue`, {}));
  }

  async complete(id) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/complete`, {}));
  }

  async reject(id) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/reject`, {}));
  }
}

export default new RequisitionApiService();

