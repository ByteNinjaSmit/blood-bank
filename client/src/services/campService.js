import apiService from './api';

// Camp Service - Single Responsibility for camp operations
class CampService {
  // Create new camp
  async createCamp(campData) {
    return await apiService.post('/api/site/new', campData);
  }

  // Get camp by ID
  async getCampById(id) {
    return await apiService.get(`/api/site/details/${id}`);
  }

  // List camps
  async listCamps(filters = {}) {
    return await apiService.get('/api/site/list', filters);
  }

  // Update camp
  async updateCamp(id, updateData) {
    return await apiService.put(`/api/site/update/${id}`, updateData);
  }

  // Delete camp
  async deleteCamp(id) {
    return await apiService.delete(`/api/site/${id}`);
  }

  // Get donations for a specific camp (site)
  async getCampDonations(siteId) {
    return await apiService.get(`/api/site/camp-donations/${siteId}`);
  }

  // Get donors for a specific camp (site)
  async getCampDonors(siteId) {
    return await apiService.get(`/api/site/camp-donors/${siteId}`);
  }
}

export default new CampService();
