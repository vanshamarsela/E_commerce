import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "../hooks/useAdminAuth.jsx";

const AdminLogin = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [, navigate] = useLocation();
    const { adminLogin } = useAdminAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const result = await adminLogin(formData.username, formData.password);
            if (result?.success) {
                navigate("/admin");
            } else {
                setError(result?.error || "Login failed.");
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="text-center text-3xl font-bold text-slate-900">
                        Admin sign in
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                            ← Back to store
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Username or Email"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                            loading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        }`}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
