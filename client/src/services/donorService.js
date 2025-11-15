import apiService from './api';

// Donor Service - Single Responsibility for donor operations
class DonorService {
  // Create new donor
  async createDonor(donorData) {
    return await apiService.post('/api/donor/new', donorData);
  }

  // Get donor by ID
  async getDonorById(id) {
    return await apiService.get(`/api/donor/${id}`);
  }

  // Search donor by criteria
  async searchDonor(searchCriteria) {
    return await apiService.get('/api/donor/search', searchCriteria);
  }

  // List donors with filters
  async listDonors(filters = {}) {
    return await apiService.get('/api/donor/list', filters);
  }

  // Update donor
  async updateDonor(id, updateData) {
    return await apiService.put(`/api/donor/update/${id}`, updateData);
  }

  // Delete donor (soft delete)
  async deleteDonor(id) {
    return await apiService.delete(`/api/donor/${id}`);
  }

  // Force delete donor with cascade
  async forceDeleteDonor(id) {
    return await apiService.delete(`/api/donor/force/${id}`);
  }
}

export default new DonorService();
