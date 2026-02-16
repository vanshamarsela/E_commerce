import axios from "axios";

// Create API instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    withCredentials: true // Important for cookies
});

// A separate client with NO refresh interceptor to avoid infinite loops
const authApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    withCredentials: true
});

let refreshPromise = null;

// Request interceptor to add access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url || "";

        // Never attempt refresh for auth endpoints where 401 is expected/meaningful
        const skipRefresh = ["/auth/login", "/auth/register", "/auth/logout", "/auth/admin/login"].some((p) =>
            url.includes(p)
        );

        // If refresh itself fails (or was requested), logout and stop
        if (url.includes("/auth/refresh")) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
            return Promise.reject(error);
        }

        // If error is 401 and we haven't tried refreshing yet
        if (!skipRefresh && error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // If we don't have an access token, treat as logged out
                const token = localStorage.getItem("access_token");
                if (!token) {
                    window.location.href = "/login";
                    return Promise.reject(error);
                }

                // De-dupe concurrent refresh calls
                if (!refreshPromise) {
                    refreshPromise = authApi.post("/auth/refresh")
                        .then((refreshResponse) => {
                            const newToken = refreshResponse.data.access_token;
                            localStorage.setItem("access_token", newToken);
                            return newToken;
                        })
                        .finally(() => {
                            refreshPromise = null;
                        });
                }

                const newToken = await refreshPromise;

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                refreshPromise = null;
                localStorage.removeItem("access_token");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Admin API: uses admin_access_token, no refresh (admin has no refresh cookie)
const adminApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    withCredentials: true
});

adminApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("admin_access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || "";
        const isLoginRequest = url.includes("/auth/admin/login");
        if (!isLoginRequest && error.response?.status === 401) {
            localStorage.removeItem("admin_access_token");
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(error);
    }
);

export { api, adminApi };