import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api.js";
import AdminLayout from "../../layouts/AdminLayout.jsx";

const defaultLimit = 20;

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [skip, setSkip] = useState(0);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await adminApi.get("/admin/users/", {
                params: { skip, limit: defaultLimit },
            });
            setUsers(res.data || []);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [skip]);

    const formatDate = (d) => {
        if (!d) return "—";
        try {
            return new Date(d).toLocaleDateString();
        } catch {
            return "—";
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Users</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-slate-500">Loading...</p>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Username</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Full name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Active</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Verified</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-slate-500 text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600">{u.id}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.email}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{u.username}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{u.full_name || "—"}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={u.is_active ? "text-green-600" : "text-red-600"}>
                                                    {u.is_active ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={u.is_verified ? "text-green-600" : "text-slate-500"}>
                                                    {u.is_verified ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                    <button
                        type="button"
                        disabled={skip === 0}
                        onClick={() => setSkip((s) => Math.max(0, s - defaultLimit))}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-500">Offset: {skip}</span>
                    <button
                        type="button"
                        disabled={users.length < defaultLimit}
                        onClick={() => setSkip((s) => s + defaultLimit)}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
