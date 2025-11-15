import apiService from './api.js';

class HospitalApiService {
  constructor() {
    this.baseUrl = '/api/hospitals';
  }

  // Initialize API service with auth token
  initialize(authToken) {
    apiService.initialize(import.meta.env.VITE_APP_URI_API, authToken);
  }

  // Enhanced error handling for better user feedback
  _handleApiResponse(response) {
    const { data, error } = response;
    
    if (error) {
      // Handle different types of errors
      let errorMessage = error;
      let validationErrors = null;

      // Handle common HTTP error messages
      if (typeof error === 'string') {
        // Check for common backend error patterns
        if (error.includes('duplicate') || error.includes('already exists')) {
          errorMessage = 'This information already exists in the system. Please check your input.';
        } else if (error.includes('validation') || error.includes('required')) {
          errorMessage = 'Please check all required fields and try again.';
        } else if (error.includes('not found')) {
          errorMessage = 'The requested hospital was not found.';
        } else if (error.includes('unauthorized') || error.includes('forbidden')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (error.includes('network') || error.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }

        // Try to parse JSON error if it looks like JSON
        if (error.includes('{')) {
          try {
            const parsedError = JSON.parse(error);
            errorMessage = parsedError.message || errorMessage;
            validationErrors = parsedError.errors || null;
          } catch (e) {
            // If parsing fails, use the processed error message
          }
        }
      }

      return {
        success: false,
        data: null,
        error: errorMessage,
        validationErrors,
        originalData: data
      };
    }

    return {
      success: true,
      data,
      error: null,
      validationErrors: null
    };
  }

  // Get user-friendly error message for common scenarios
  _getUserFriendlyErrorMessage(operation, error) {
    const operationMessages = {
      create: 'adding the hospital',
      update: 'updating the hospital',
      delete: 'deleting the hospital',
      fetch: 'loading hospitals'
    };

    const baseMessage = `Error ${operationMessages[operation] || 'processing your request'}`;
    
    if (error.includes('duplicate') || error.includes('already exists')) {
      return `${baseMessage}: This information already exists in the system.`;
    } else if (error.includes('not found')) {
      return `${baseMessage}: Hospital not found.`;
    } else if (error.includes('unauthorized')) {
      return `${baseMessage}: You don't have permission for this action.`;
    } else if (error.includes('validation')) {
      return `${baseMessage}: Please check your input and try again.`;
    } else {
      return `${baseMessage}. Please try again.`;
    }
  }

  // Get all hospitals with filters and pagination
  async getHospitals(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add pagination params
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add sorting params
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    // Add filter params
    if (params.name) queryParams.append('name', params.name);
    if (params.contactPerson) queryParams.append('contactPerson', params.contactPerson);
    if (params.phone) queryParams.append('phone', params.phone);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await apiService.get(url);
    return this._handleApiResponse(response);
  }

  // Get single hospital by ID
  async getHospitalById(id) {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return this._handleApiResponse(response);
  }

  // Create new hospital
  async createHospital(hospitalData) {
    const response = await apiService.post(this.baseUrl, hospitalData);
    return this._handleApiResponse(response);
  }

  // Update hospital
  async updateHospital(id, hospitalData) {
    const response = await apiService.put(`${this.baseUrl}/${id}`, hospitalData);
    return this._handleApiResponse(response);
  }

  // Delete hospital
  async deleteHospital(id) {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return this._handleApiResponse(response);
  }
}

export default new HospitalApiService();
