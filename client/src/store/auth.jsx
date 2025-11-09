import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Create context
export const AuthContext = createContext();

// Helper function to get token from cookies
const getTokenFromCookies = () => {
    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="));
    return cookieValue ? cookieValue.split("=")[1] : null;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const isRefreshingRef = useRef(false);
    const isLoggingOutRef = useRef(false);

    const authorizationToken = token ? `Bearer ${token}` : "";

    const storeTokenInCookies = (serverToken) => {
        // Deprecated cookie storage for access token. Keep function name for backward compatibility.
        setToken(serverToken);
    };

    const API = import.meta.env.VITE_APP_URI_API;

    let isLoggedIn = !!token;

    // Logout functionality
    const LogoutUser = async () => {
        isLoggingOutRef.current = true;
        try {
            await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
        } catch (e) {
            // ignore
        }
        setToken(null);
        setUser(null);
        setIsAdmin(false);
        setIsDeveloper(false);
        // Clear Authorization header on axios defaults to avoid lingering tokens
        if (axios.defaults.headers?.common) {
            delete axios.defaults.headers.common.Authorization;
        }
        toast.success(`Logout Successfully`);
        setTimeout(() => {
            window.location.href = "/login";
        }, 400);
    };

    // JWT Authentication - fetch current logged-in user data
    const userAuthentication = async () => {
        if(!token) return;
        try {
            setIsLoading(true);
            const response = await axios.get(`${API}/api/auth/current`, {
                headers: {
                    Authorization: authorizationToken,
                },
                withCredentials: true,
            });
            if (response.status === 200) {
                const data = response.data;
                setUser(data.user);
                setUser(data.user);
            }
        } catch (error) {
            // 401 is handled by the axios interceptor (refresh + retry or logout)
            if (error?.response?.status === 401) {
                return;
            }
            // Ignore cancellations silently
            if (axios.isCancel?.(error)) {
                return;
            }
            // Log and optionally notify for non-auth errors
            console.error("Failed to fetch current user:", error);
            toast.error("Failed to load user. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API}/api/auth/login`, { email, password }, { withCredentials: true });
        setToken(res.data.accessToken);
        setUser(res.data.user);
        try { userAuthentication(); } catch (_) { }
        return res.data;
    };

    // OTP Login (2-step): start -> verify -> (optional) resend
    const loginStartOtp = async (email, password) => {
        const res = await axios.post(`${API}/api/auth/login/start-otp`, { email, password }, { withCredentials: true });
        return res.data; // { success, txnId, email, expiresInSeconds, resendCooldownSeconds }
    };

    const verifyOtpLogin = async (email, txnId, code) => {
        const res = await axios.post(`${API}/api/auth/login/verify-otp`, { email, txnId, code }, { withCredentials: true });
        setToken(res.data.accessToken);
        setUser(res.data.user);
        try { userAuthentication(); } catch (_) { }
        return res.data;
    };

    const resendOtpLogin = async (email, txnId) => {
        const res = await axios.post(`${API}/api/auth/login/resend-otp`, { email, txnId }, { withCredentials: true });
        return res.data; // { success, ... }
    };

    const refreshAccessToken = async () => {
        try {
            const res = await axios.post(`${API}/api/auth/refresh`, {}, { withCredentials: true });
            setToken(res.data.accessToken);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Effect to handle initial user authentication if token exists
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
    }, []);

    // Whenever token changes, fetch the user
    useEffect(() => {
        if (token) userAuthentication();
    }, [token]);


    useEffect(() => {
        setIsAdmin(false);

        setIsDeveloper(false);

        if (user) {
            const { isDeveloper, isAdmin } = user;
            // console.log('User: ',user)
            setIsAdmin(isAdmin); // Admin if any of the roles is true
            // setisUser(isUser || false);
            setIsDeveloper(isDeveloper || false);
            if (isDeveloper) {
                console.log(`This is Developer`);
            }
        }
    }, [user]);

    // Axios interceptors: attach token, auto refresh on 401 and retry
    useEffect(() => {
        const reqId = axios.interceptors.request.use((config) => {
            const isAuthEndpoint = config.url?.includes('/api/auth/');
            if (token && !isAuthEndpoint) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.withCredentials = true;
            return config;
        });

        let isRefreshing = false;
        let pending = [];
        const notifyPending = (newToken) => {
            pending.forEach((p) => p.resolve(newToken));
            pending = [];
        };
        const failPending = (err) => {
            pending.forEach((p) => p.reject(err));
            pending = [];
        };

        const resId = axios.interceptors.response.use(
            (res) => res,
            async (error) => {
                const original = error.config;
                const isAuthEndpoint = original?.url?.includes('/api/auth/');
                if (isLoggingOutRef.current || isAuthEndpoint) {
                    // If we're logging out, do not attempt refresh at all
                    return Promise.reject(error);
                }
                if (error.response && error.response.status === 401 && !original._retry) {
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
                        const ok = await refreshAccessToken();
                        if (!ok) throw new Error("refresh_failed");
                        const newToken = axios.defaults.headers.common.Authorization?.replace("Bearer ", "") || token;
                        notifyPending(newToken);
                        isRefreshing = false;
                        // Refresh succeeded: refresh current user in background
                        try { userAuthentication(); } catch (_) { }
                        original.headers.Authorization = `Bearer ${newToken}`;
                        return axios(original);
                    } catch (e) {
                        isRefreshing = false;
                        failPending(e);
                        // Prevent recursion: set flag and avoid refresh loop
                        isLoggingOutRef.current = true;
                        await LogoutUser();
                        return Promise.reject(e);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(reqId);
            axios.interceptors.response.eject(resId);
        };
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
    const authContextValue = useContext(AuthContext);
    if (!authContextValue) {
        throw new Error("useAuth must be used within the AuthProvider");
    }
    return authContextValue;
};