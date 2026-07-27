import axios from 'axios';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { setAuthToken, clearAuthToken, setRefreshCallback } from '@/core/auth-token-store';
import { authApi } from '@/modules/auth/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  const isLoggedIn = Boolean(token);
  // role is a free-text display label with no authorization meaning —
  // isFullAccess is the sole source of "this account can do everything"
  // (see server/src/shared/role-map.ts).
  const isAdmin = !!user?.isFullAccess;
  const authorizationToken = token ? `Bearer ${token}` : '';
  const API = import.meta.env.VITE_APP_URI_API;
  const storeTokenInCookies = (t) => setToken(t); // deprecated alias

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refreshAccessToken = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      setToken(data.accessToken);
      if (data.user) setUser(data.user);
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  // Register refresh fn with auth-token-store so apiClient 401 interceptor can call it.
  const refreshRef = useRef(refreshAccessToken);
  refreshRef.current = refreshAccessToken;
  useEffect(() => {
    setRefreshCallback(() => refreshRef.current());
    return () => setRefreshCallback(null);
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const LogoutUser = useCallback(async () => {
    isLoggingOutRef.current = true;
    try { await authApi.logout(); } catch { /* ignore network errors */ }
    setToken(null);
    setUser(null);
    clearAuthToken();
    if (axios.defaults.headers?.common) {
      delete axios.defaults.headers.common.Authorization;
    }
    toast.success('Logged out');
    setTimeout(() => { window.location.href = '/login'; }, 400);
  }, []);

  // ── Current user ──────────────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async (forToken) => {
    if (!forToken) return;
    try {
      const data = await authApi.current(forToken);
      if (data?.user) setUser(data.user);
    } catch (err) {
      if (err?.response?.status === 401 || err?.status === 401) return;
      console.error('fetchCurrentUser failed:', err?.message ?? err);
    }
  }, []);

  // ── Startup: silent refresh ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const path = window.location?.pathname ?? '';
      const isPublicRoute = path.startsWith('/login') || path.startsWith('/register');
      if (!isPublicRoute && !isLoggingOutRef.current) {
        await refreshAccessToken();
      }
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync token into auth-token-store ─────────────────────────────────────
  useEffect(() => {
    if (token) {
      setAuthToken(token);
      if (!user) fetchCurrentUser(token); // only when user not yet hydrated
    } else {
      clearAuthToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Global axios interceptors (legacy /api/* pages) ──────────────────────
  useEffect(() => {
    const reqId = axios.interceptors.request.use((config) => {
      if (token && !config.url?.includes('/api/v2/auth/')) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.withCredentials = true;
      return config;
    });

    let refreshing = false;
    let pending = [];
    const flush = (err, t) => { pending.forEach((p) => (err ? p.reject(err) : p.resolve(t))); pending = []; };

    const resId = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        const isAuthEndpoint = original?.url?.includes('/auth/');
        if (isLoggingOutRef.current || isAuthEndpoint) return Promise.reject(error);

        if (error.response?.status === 401 && !original._retry) {
          if (refreshing) {
            return new Promise((resolve, reject) => pending.push({ resolve, reject }))
              .then((t) => { original.headers.Authorization = `Bearer ${t}`; return axios(original); });
          }
          original._retry = true;
          refreshing = true;
          try {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error('refresh_failed');
            refreshing = false;
            flush(null, newToken);
            original.headers.Authorization = `Bearer ${newToken}`;
            return axios(original);
          } catch (e) {
            refreshing = false;
            flush(e);
            isLoggingOutRef.current = true;
            await LogoutUser();
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  // ── Registration ──────────────────────────────────────────────────────────
  const registerStartOtp = (payload) => authApi.startRegister(payload);
  const verifyRegisterOtp = (email, txnId, code) => authApi.verifyRegister(email, txnId, code);
  const resendRegisterOtp = (email, txnId) => authApi.resendRegister(email, txnId);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        isLoading,
        user,
        token,
        authorizationToken,
        API,
        storeTokenInCookies,
        login,
        registerStartOtp,
        verifyRegisterOtp,
        resendRegisterOtp,
        refreshAccessToken,
        LogoutUser,
        isDeveloper: false, // deprecated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
