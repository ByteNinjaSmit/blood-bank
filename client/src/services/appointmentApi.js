import apiService from './api.js';

class AppointmentApiService {
  constructor() {
    this.baseUrl = '/api/appointments';
  }

  initialize(authToken) {
    apiService.initialize(import.meta.env.VITE_APP_URI_API, authToken);
  }

  _handleApiResponse(response) {
    const { data, error } = response;

    if (error) {
      let errorMessage = error;
      let validationErrors = null;

      if (typeof error === 'string') {
        if (error.includes('validation') || error.includes('required')) {
          errorMessage = 'Please check all required fields and try again.';
        } else if (error.includes('unauthorized') || error.includes('forbidden')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (error.includes('network') || error.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }

        if (error.includes('{')) {
          try {
            const parsedError = JSON.parse(error);
            errorMessage = parsedError.message || errorMessage;
            validationErrors = parsedError.errors || null;
          } catch (e) {
            // ignore JSON parse errors
          }
        }
      }

      return {
        success: false,
        data: null,
        error: errorMessage,
        validationErrors,
        originalData: data,
      };
    }

    return {
      success: true,
      data,
      error: null,
      validationErrors: null,
    };
  }

  async getAppointments(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.status) queryParams.append('status', params.status);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await apiService.get(url);
    return this._handleApiResponse(response);
  }
}

export default new AppointmentApiService();

