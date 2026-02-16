import { useState, createContext, useContext, useEffect } from "react";
import { adminApi } from "../lib/api.js";

const AdminAuthContext = createContext(null);

const AdminAuthProvider = ({ children }) => {
    const logic = useAdminAuthLogic();
    return (
        <AdminAuthContext.Provider value={logic}>
            {children}
        </AdminAuthContext.Provider>
    );
};

const useAdminAuthLogic = () => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAuthStatus();
    }, []);

    const checkAdminAuthStatus = async () => {
        const token = localStorage.getItem("admin_access_token");
        if (!token) {
            setIsAdminAuthenticated(false);
            setAdmin(null);
            setLoading(false);
            return;
        }
        try {
            const response = await adminApi.get("/auth/admin/me");
            setAdmin(response.data);
            setIsAdminAuthenticated(true);
        } catch {
            localStorage.removeItem("admin_access_token");
            setIsAdminAuthenticated(false);
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    };

    const adminLogin = async (username, password) => {
        try {
            const response = await adminApi.post("/auth/admin/login", { username, password });
            localStorage.setItem("admin_access_token", response.data.access_token);
            await checkAdminAuthStatus();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || "Admin login failed"
            };
        }
    };

    const adminLogout = () => {
        localStorage.removeItem("admin_access_token");
        setIsAdminAuthenticated(false);
        setAdmin(null);
    };

    return {
        isAdminAuthenticated,
        admin,
        loading,
        adminLogin,
        adminLogout,
        checkAdminAuthStatus,
    };
};

const useAdminAuth = () => useContext(AdminAuthContext);

export { AdminAuthProvider, useAdminAuth };
