import { apiClient } from '@/core/api-client';

export default {
  initialize: () => {}, // no-op shim for compatibility
  getHospitals: async (params) => {
    try {
      const response = await apiClient.get('/api/v2/hospital', { params });
      // Backend returns { success: true, data: [...], pagination: { total, page, pages } }
      const items = (response.data?.data || []).map(item => ({
        ...item,
        _id: item.id || item._id,
        id: item.id || item._id
      }));
      const pagination = response.data?.pagination || {};
      return {
        success: true,
        data: {
          data: items,
          pagination: {
            totalPages: pagination.totalPages ?? pagination.pages ?? 0,
            totalCount: pagination.totalCount ?? pagination.total ?? 0,
            page: pagination.currentPage ?? pagination.page ?? 1,
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to load hospitals'
      };
    }
  },
  getHospitalById: async (id) => {
    try {
      const response = await apiClient.get(`/api/v2/hospital/${id}`);
      const item = response.data?.data || response.data;
      if (item && typeof item === 'object') {
        item._id = item.id || item._id;
        item.id = item.id || item._id;
      }
      return {
        success: true,
        data: item
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to load hospital details'
      };
    }
  },
  createHospital: async (data) => {
    try {
      const response = await apiClient.post('/api/v2/hospital', data);
      const item = response.data?.data || response.data;
      if (item && typeof item === 'object') {
        item._id = item.id || item._id;
        item.id = item.id || item._id;
      }
      return {
        success: true,
        data: item
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create hospital'
      };
    }
  },
  updateHospital: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/v2/hospital/${id}`, data);
      const item = response.data?.data || response.data;
      if (item && typeof item === 'object') {
        item._id = item.id || item._id;
        item.id = item.id || item._id;
      }
      return {
        success: true,
        data: item
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update hospital'
      };
    }
  },
  deleteHospital: async (id) => {
    try {
      await apiClient.delete(`/api/v2/hospital/${id}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete hospital'
      };
    }
  },
};
