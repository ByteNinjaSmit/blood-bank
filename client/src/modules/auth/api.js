// Auth API. Dedicated axios instance (withCredentials for the refresh
// cookie) with NO interceptors — auth calls must never trigger the
// global 401-refresh loop. Targets the new /api/v2/auth module, which
// wraps responses in { success, data }.

import axios from 'axios';

const BASE = import.meta.env.VITE_APP_URI_API ?? 'http://localhost:5000';

const authAxios = axios.create({
  baseURL: `${BASE}/api/v2/auth`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = (res) => res.data?.data ?? res.data;

export const authApi = {
  login: (email, password) => authAxios.post('/login', { email, password }).then(unwrap),

  startOtpLogin: (email, password) =>
    authAxios.post('/login/start-otp', { email, password }).then(unwrap),
  verifyOtpLogin: (email, txnId, code) =>
    authAxios.post('/login/verify-otp', { email, txnId, code }).then(unwrap),
  resendOtpLogin: (email, txnId) =>
    authAxios.post('/login/resend-otp', { email, txnId }).then(unwrap),

  startRegister: (payload) => authAxios.post('/register/start-otp', payload).then(unwrap),
  verifyRegister: (email, txnId, code) =>
    authAxios.post('/register/verify-otp', { email, txnId, code }).then(unwrap),
  resendRegister: (email, txnId) =>
    authAxios.post('/register/resend-otp', { email, txnId }).then(unwrap),

  refresh: () => authAxios.post('/refresh', {}).then(unwrap),
  logout: () => authAxios.post('/logout', {}).then(unwrap),
  current: (token) =>
    authAxios.get('/current', { headers: { Authorization: `Bearer ${token}` } }).then(unwrap),
};
