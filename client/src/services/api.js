import axios from 'axios';

// Base API configuration - no hooks used here
const createApiClient = (baseURL, token) => {
  return axios.create({
    baseURL,
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
};

// Generic API service following Single Responsibility Principle
class ApiService {
  constructor() {
    this.client = null;
  }

  // Initialize the client with auth data
  initialize(baseURL, token) {
    this.client = createApiClient(baseURL, token);
  }

  async get(url, params = {}) {
    if (!this.client) {
      return { data: null, error: 'API client not initialized' };
    }
    try {
      const response = await this.client.get(url, { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || error.message };
    }
  }

  async post(url, data = {}) {
    if (!this.client) {
      return { data: null, error: 'API client not initialized' };
    }
    try {
      const response = await this.client.post(url, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || error.message };
    }
  }

  async put(url, data = {}) {
    if (!this.client) {
      return { data: null, error: 'API client not initialized' };
    }
    try {
      const response = await this.client.put(url, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || error.message };
    }
  }

  async delete(url) {
    if (!this.client) {
      return { data: null, error: 'API client not initialized' };
    }
    try {
      const response = await this.client.delete(url);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || error.message };
    }
  }
}

export default new ApiService();
