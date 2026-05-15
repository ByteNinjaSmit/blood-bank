import apiService from './api';

// Camp Service - Single Responsibility for camp operations
class CampService {
  initialize(authToken) {
    apiService.initialize(import.meta.env.VITE_APP_URI_API, authToken);
  }

  _handleApiResponse(response) {
    const { data, error } = response;
    if (error) {
      return { success: false, data: null, error: error };
    }
    return { 
      success: true, 
      data: data?.data || data, 
      pagination: data?.pagination || null,
      message: data?.message 
    };
  }

  // Create new camp
  async createCamp(campData) {
    const response = await apiService.post('/api/site/new', campData);
    return this._handleApiResponse(response);
  }

  // Get camp by ID
  async getCampById(id) {
    const response = await apiService.get(`/api/site/details/${id}`);
    return this._handleApiResponse(response);
  }

  // List camps
  async listCamps(filters = {}) {
    const response = await apiService.get('/api/site/list', filters);
    return this._handleApiResponse(response);
  }

  // Update camp
  async updateCamp(id, updateData) {
    const response = await apiService.put(`/api/site/update/${id}`, updateData);
    return this._handleApiResponse(response);
  }

  // Delete camp
  async deleteCamp(id) {
    const response = await apiService.delete(`/api/site/${id}`);
    return this._handleApiResponse(response);
  }

  // Get donations for a specific camp (site)
  async getCampDonations(siteId) {
    const response = await apiService.get(`/api/site/camp-donations/${siteId}`);
    return this._handleApiResponse(response);
  }

  // Get donors for a specific camp (site)
  async getCampDonors(siteId) {
    const response = await apiService.get(`/api/site/camp-donors/${siteId}`);
    return this._handleApiResponse(response);
  }

  // Get all voluntary camp donations
  async getVoluntaryDonations(params = {}) {
    const response = await apiService.get('/api/site/voluntary-donations', params);
    return this._handleApiResponse(response);
  }
}

export default new CampService();
