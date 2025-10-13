import apiService from './api';

// Donation Service - Single Responsibility for donation operations
class DonationService {
  // Create new donation
  async createDonation(donationData) {
    return await apiService.post('/api/donation/new', donationData);
  }

  // Get donation by ID
  async getDonationById(id) {
    return await apiService.get(`/api/donation/${id}`);
  }

  // List donations with filters
  async listDonations(filters = {}) {
    return await apiService.get('/api/donation/list', filters);
  }

  // Update donation
  async updateDonation(id, updateData) {
    return await apiService.put(`/api/donation/${id}`, updateData);
  }

  // Update donation status
  async updateDonationStatus(id, status) {
    return await apiService.put(`/api/donation/${id}/status`, { status });
  }

  // Delete donation
  async deleteDonation(id) {
    return await apiService.delete(`/api/donation/${id}`);
  }
}

export default new DonationService();
