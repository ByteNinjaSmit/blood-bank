import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setAuthToken, clearAuthToken } from "@/core/auth-token-store";
import { authApi } from "@/modules/auth/api";

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const isLoggingOutRef = useRef(false);

    const authorizationToken = token ? `Bearer ${token}` : "";
    const API = import.meta.env.VITE_APP_URI_API;
    const isLoggedIn = !!token;

    // Deprecated name kept for callers that still import it.
    const storeTokenInCookies = (serverToken) => setToken(serverToken);

    // ---- Logout ----
    const LogoutUser = async () => {
        isLoggingOutRef.current = true;
        try {
            await authApi.logout();
        } catch {
            /* ignore network errors on logout */
        }
        setToken(null);
        setUser(null);
        setIsAdmin(false);
        setIsDeveloper(false);
        clearAuthToken();
        if (axios.defaults.headers?.common) {
            delete axios.defaults.headers.common.Authorization;
        }
        toast.success("Logged out");
        setTimeout(() => {
            window.location.href = "/login";
        }, 400);
    };

    // ---- Current user ----
    const userAuthentication = async (forToken = token) => {
        if (!forToken) return;
        try {
            setIsLoading(true);
            const data = await authApi.current(forToken);
            if (data?.user) setUser(data.user);
        } catch (error) {
            if (error?.response?.status === 401) return; // refresh flow handles it
            if (axios.isCancel?.(error)) return;
            console.error("Failed to fetch current user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ---- Password login ----
    const login = async (email, password) => {
        const data = await authApi.login(email, password);
        setToken(data.accessToken);
        setUser(data.user);
        return data;
    };

    // ---- OTP login (2-step) ----
    const loginStartOtp = async (email, password) => authApi.startOtpLogin(email, password);
    const verifyOtpLogin = async (email, txnId, code) => {
        const data = await authApi.verifyOtpLogin(email, txnId, code);
        setToken(data.accessToken);
        setUser(data.user);
        return data;
    };
    const resendOtpLogin = async (email, txnId) => authApi.resendOtpLogin(email, txnId);

    // ---- Registration OTP flow ----
    const registerStartOtp = async (payload) => authApi.startRegister(payload);
    const verifyRegisterOtp = async (email, txnId, code) =>
        authApi.verifyRegister(email, txnId, code);
    const resendRegisterOtp = async (email, txnId) => authApi.resendRegister(email, txnId);

    // ---- Refresh ---- returns the new access token, or null on failure.
    const refreshAccessToken = async () => {
        try {
            const data = await authApi.refresh();
            setToken(data.accessToken);
            if (data.user) setUser(data.user);
            return data.accessToken;
        } catch {
            return null;
        }
    };

    // On mount: try a silent refresh (unless on the login route).
    useEffect(() => {
        (async () => {
            const onLoginRoute =
                typeof window !== "undefined" &&
                window.location?.pathname?.startsWith("/login");
            if (!onLoginRoute && !isLoggingOutRef.current) {
                await refreshAccessToken();
            }
            setIsLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the module-level token store (used by the api-client for
    // /api/v2 feature calls) in sync.
    useEffect(() => {
        if (token) {
            setAuthToken(token);
            userAuthentication(token);
        } else {
            clearAuthToken();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Derive role flags.
    useEffect(() => {
        setIsAdmin(false);
        setIsDeveloper(false);
        if (user) {
            setIsAdmin(
                user.isAdmin === true || user.role === "admin" || user.role === "system-admin",
            );
            setIsDeveloper(user.isDeveloper === true);
        }
    }, [user]);

    // Global axios interceptors: attach token to legacy /api/* calls and
    // auto-refresh on 401. The /api/v2/auth/* endpoints use their own
    // interceptor-free instance, so they never recurse here.
    useEffect(() => {
        const reqId = axios.interceptors.request.use((config) => {
            const isAuthEndpoint = config.url?.includes("/auth/");
            if (token && !isAuthEndpoint) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.withCredentials = true;
            return config;
        });

        let isRefreshing = false;
        let pending = [];
        const flush = (err, newToken) => {
            pending.forEach((p) => (err ? p.reject(err) : p.resolve(newToken)));
            pending = [];
        };

        const resId = axios.interceptors.response.use(
            (res) => res,
            async (error) => {
                const original = error.config;
                const isAuthEndpoint = original?.url?.includes("/auth/");
                if (isLoggingOutRef.current || isAuthEndpoint) return Promise.reject(error);

                if (error.response?.status === 401 && !original._retry) {
                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            pending.push({ resolve, reject });
                        }).then((newToken) => {
                            original.headers.Authorization = `Bearer ${newToken}`;
                            return axios(original);
                        });
                    }
                    original._retry = true;
                    isRefreshing = true;
                    try {
                        const newToken = await refreshAccessToken();
                        if (!newToken) throw new Error("refresh_failed");
                        isRefreshing = false;
                        flush(null, newToken);
                        original.headers.Authorization = `Bearer ${newToken}`;
                        return axios(original);
                    } catch (e) {
                        isRefreshing = false;
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

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                storeTokenInCookies,
                login,
                loginStartOtp,
                verifyOtpLogin,
                resendOtpLogin,
                registerStartOtp,
                verifyRegisterOtp,
                resendRegisterOtp,
                refreshAccessToken,
                LogoutUser,
                user,
                authorizationToken,
                isLoading,
                isAdmin,
                isDeveloper,
                API,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use AuthContext
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within the AuthProvider");
    return ctx;
};
