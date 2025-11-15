import apiService from './api.js';

class InventoryApiService {
  constructor() {
    this.baseUrl = '/api/inventory';
  }

  initialize(authToken) {
    apiService.initialize(import.meta.env.VITE_APP_URI_API, authToken);
  }

  _wrap(resp) {
    const { data, error, errorData } = resp;
    if (error) return { success: false, error, data: null, errorData };
    return { success: true, data: data?.data ?? data, raw: data };
  }

  async list(params = {}) {
    return this._wrap(await apiService.get(`${this.baseUrl}`, params));
  }

  async reserveByCriteria(payload) {
    return this._wrap(await apiService.post(`${this.baseUrl}/reserve/fifo`, payload));
  }
}

export default new InventoryApiService();
