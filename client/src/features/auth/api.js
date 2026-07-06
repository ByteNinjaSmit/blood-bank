import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/auth';

export const authApi = {
  // Password login (single step)
  login: (data) => apiClient.post(`${BASE}/login`, data).then(unwrap),

  // Registration OTP flow
  startRegister: (data) => apiClient.post(`${BASE}/register/start-otp`, data).then(unwrap),
  verifyRegister: (data) => apiClient.post(`${BASE}/register/verify-otp`, data).then(unwrap),
  resendRegister: (data) => apiClient.post(`${BASE}/register/resend-otp`, data).then(unwrap),

  // Session management
  refresh: () => apiClient.post(`${BASE}/refresh`, {}).then(unwrap),
  logout: () => apiClient.post(`${BASE}/logout`, {}).then(unwrap),
  current: () => apiClient.get(`${BASE}/current`).then(unwrap),
};
