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

  async updateRequest(id, payload) {
    return this._wrap(await apiService.put(`${this.baseUrl}/${id}`, payload));
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

  async issue(id, unitIds = []) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/issue`, { unitIds }));
  }

  async complete(id) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/complete`, {}));
  }

  async reject(id, rejectionReason) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/reject`, { rejectionReason }));
  }

  async updateCrossmatch(requestId, { inventoryId, crossmatchStatus, compatibilityResult, crossmatchDoneAt, crossmatchSeenAt, cardNumber }) {
    return this._wrap(
      await apiService.patch(`${this.baseUrl}/${requestId}/crossmatch`, {
        inventoryId,
        crossmatchStatus,
        compatibilityResult,
        crossmatchDoneAt,
        crossmatchSeenAt,
        cardNumber,
      })
    );
  }

  // Match Review: available in-stock bags an operator may pick for a
  // component (optionally narrowed to a specific compatible ABO group).
  async getAvailableUnits(id, { componentType, aboGroup } = {}) {
    const params = { componentType };
    if (aboGroup) params.aboGroup = aboGroup;
    return this._wrap(await apiService.get(`${this.baseUrl}/${id}/available-units`, params));
  }

  // Swap a proposed bag for another available compatible bag (no reservation).
  async swapMatchedUnit(id, { fromUnitId, toUnitId }) {
    return this._wrap(
      await apiService.patch(`${this.baseUrl}/${id}/matched-unit`, { fromUnitId, toUnitId }),
    );
  }

  // Save the recipient (patient-side) blood-grouping worksheet.
  async saveRecipientGrouping(id, grouping) {
    return this._wrap(await apiService.patch(`${this.baseUrl}/${id}/grouping`, grouping));
  }

  // Save a per-bag (donor-side) blood-grouping worksheet.
  async saveBagGrouping(id, { unitId, grouping }) {
    return this._wrap(
      await apiService.patch(`${this.baseUrl}/${id}/matched-unit/grouping`, { unitId, grouping }),
    );
  }

  async getCompatibilityInfo(componentType, bloodGroup, rh, plateletCompatibilityMode) {
    const params = { componentType };
    if (bloodGroup) params.bloodGroup = bloodGroup;
    if (rh) params.rh = rh;
    if (plateletCompatibilityMode) params.plateletCompatibilityMode = plateletCompatibilityMode;
    return this._wrap(await apiService.get(`${this.baseUrl}/compatibility-info`, params));
  }

}

export default new RequisitionApiService();

