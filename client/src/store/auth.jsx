import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
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
    const [token, setToken] = useState(getTokenFromCookies());
    const [user, setUser] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [tokenExpiry, setTokenExpiry] = useState(null); // New: track token expiry timestamp

    const authorizationToken = `Bearer ${token}`;

    const storeTokenInCookies = (serverToken) => {
        setToken(serverToken);
        document.cookie = `authToken=${serverToken}; path=/; max-age=1800; secure; samesite=strict`;
        // Set expiry timestamp for countdown (current time + 1800 seconds)
        setTokenExpiry(Date.now() + 1800 * 1000);
    };

    const API = import.meta.env.VITE_APP_URI_API;



    let isLoggedIn = !!token;

    // Logout functionality
    const LogoutUser = () => {
        setToken(null);
        setUser(null);
        setIsAdmin(false);
        setIsDeveloper(false);

        // Remove token from cookies
        document.cookie = "authToken=; path=/; max-age=0";
        toast.success(`Logout Successfully`);

        setTimeout(() => {
            window.location.href = "/login";
        }, 500);
    };

    // JWT Authentication - fetch current logged-in user data
    const userAuthentication = async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const response = await axios.get(`${API}/api/auth/current`, {
                headers: {
                    Authorization: authorizationToken,
                },
                withCredentials: true,
            });
            if (response.status == 200) {
                const data = response.data;
                setUser(data.user);
                // console.log("Authenticated User:", data.user);

            } else {
                console.error("Error fetching user data");
            }
        } catch (error) {
            console.log("Error fetching user data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to handle initial user authentication if token exists
    useEffect(() => {
        if (token) {
            userAuthentication();
        } else {
            setIsLoading(false);
        }
    }, [token]);
    // Auto logout & countdown warning
    useEffect(() => {
        if (!tokenExpiry) return;

        const interval = setInterval(() => {
            const timeLeft = tokenExpiry - Date.now();

            if (timeLeft <= 0) {
                LogoutUser();
                clearInterval(interval);
            } else if (timeLeft <= 2 * 60 * 1000) { // 2 minutes warning
                toast.warning("Your session will expire in 2 minutes!");
            }
        }, 5000); // check every 5 seconds

        return () => clearInterval(interval);
    }, [tokenExpiry]);

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



    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                storeTokenInCookies,
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