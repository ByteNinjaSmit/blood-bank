import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/auth';

export const authApi = {
  login: (data) => apiClient.post(`${BASE}/login`, data).then(unwrap),
  logout: () => apiClient.post(`${BASE}/logout`).then(unwrap),
  refresh: () => apiClient.post(`${BASE}/refresh`).then(unwrap),
  me: () => apiClient.get(`${BASE}/me`).then(unwrap),
  startOtp: (data) => apiClient.post(`${BASE}/otp/start`, data).then(unwrap),
  verifyOtp: (data) => apiClient.post(`${BASE}/otp/verify`, data).then(unwrap),
  resendOtp: (data) => apiClient.post(`${BASE}/otp/resend`, data).then(unwrap),
  startRegister: (data) => apiClient.post(`${BASE}/register/start`, data).then(unwrap),
  verifyRegister: (data) => apiClient.post(`${BASE}/register/verify`, data).then(unwrap),
};
