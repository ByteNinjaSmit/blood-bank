import axios from 'axios';
import { getAuthToken, setAuthToken, clearAuthToken, callRefresh } from './auth-token-store';

const BASE_URL = import.meta.env.VITE_APP_URI_API ?? 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Inject current access token on every request.
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queued callers waiting for the in-flight refresh.
let _refreshing = false;
let _queue = [];
function _flush(err, token) {
  _queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  _queue = [];
}

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
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes('/api/v2/auth/');

    // 401: try a silent refresh once, then replay. Never retry auth endpoints.
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      if (_refreshing) {
        return new Promise((resolve, reject) => _queue.push({ resolve, reject }))
          .then((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(original);
          });
      }

      original._retry = true;
      _refreshing = true;

      try {
        const newToken = await callRefresh();
        if (!newToken) throw new Error('no_token');
        setAuthToken(newToken);
        _refreshing = false;
        _flush(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (e) {
        _refreshing = false;
        _flush(e);
        clearAuthToken();
        return Promise.reject(error);
      }
    }

    if (error.response) {
      const payload = error.response.data ?? {};
      if (error.response.status === 401) clearAuthToken();
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
  return payload;
}
