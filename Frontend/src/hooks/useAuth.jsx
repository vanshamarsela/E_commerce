import { useState, createContext, useContext, useEffect } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const authLogic = useAuthLogic();
    return (
        <AuthContext.Provider value={authLogic}>
            {children}
        </AuthContext.Provider>
    )
}

const useAuthLogic = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            // Try to get user info with current token.
            // If token is expired but refresh is still valid, the Axios interceptor will refresh and retry.
            const response = await api.get("/auth/me");
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            // If /auth/refresh also fails (401), we consider the session logged out.
            localStorage.removeItem("access_token");
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await api.post("/auth/login", { username, password });
            localStorage.setItem("access_token", response.data.access_token);
            await checkAuthStatus(); // This will fetch user info
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || "Login failed"
            };
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout API call failed:", error);
        } finally {
            // Always clear local storage and state
            localStorage.removeItem("access_token");
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const register = async (userData) => {
        try {
            await api.post("/auth/register", userData);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || "Registration failed"
            };
        }
    };

    return {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        register,
        checkAuthStatus,
    };
};

const useAuth = () => {
    return useContext(AuthContext);
};

export { AuthProvider, useAuth };