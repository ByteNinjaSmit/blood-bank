// Shared axios instance. All feature `api.js` modules import from
// here. Auth header is injected automatically from `auth-token-store`.
//
// Response shape from the new /api/v2 endpoints:
//   success: { success: true, data, requestId }
//   error:   { success: false, code, message, details?, requestId }
//
// We unwrap on success and throw an `ApiError` on failure so callers
// (and TanStack Query) can rely on Promise resolution to mean "data".

import axios from 'axios';
import { getAuthToken, clearAuthToken } from './auth-token-store';

const BASE_URL = import.meta.env.VITE_APP_URI_API ?? 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  constructor({ code, message, details, status, requestId }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
    this.requestId = requestId;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const payload = error.response.data ?? {};
      if (error.response.status === 401) {
        // Token rejected. Auth provider's separate /api/auth/refresh
        // flow handles retry/logout. We just surface a clean error.
        clearAuthToken();
      }
      throw new ApiError({
        code: payload.code ?? 'HTTP_ERROR',
        message: payload.message ?? error.message,
        details: payload.details,
        status: error.response.status,
        requestId: payload.requestId ?? error.response.headers?.['x-request-id'],
      });
    }
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: error.message ?? 'Network request failed',
      status: 0,
    });
  },
);

/** Unwrap the standard `{success,data}` envelope. */
export function unwrap(response) {
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (!payload.success) {
      throw new ApiError({
        code: payload.code ?? 'API_ERROR',
        message: payload.message ?? 'Request failed',
        details: payload.details,
        status: response.status,
        requestId: payload.requestId,
      });
    }
    return payload.data;
  }
  // Legacy endpoint without the envelope — pass through.
  return payload;
}
