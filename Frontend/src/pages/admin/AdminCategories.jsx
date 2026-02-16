import { useState, useEffect } from "react";
import { Link } from "wouter";
import { adminApi } from "../../lib/api.js";
import AdminLayout from "../../layouts/AdminLayout.jsx";

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCategories = async () => {
        try {
            const res = await adminApi.get("/admin/categories/");
            setCategories(res.data || []);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await adminApi.delete(`/admin/categories/${id}`);
            await loadCategories();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to delete");
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
                    <Link
                        to="/admin/categories/new"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                    >
                        Add category
                    </Link>
                </div>

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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-slate-500 text-sm">
                                            No categories yet.{" "}
                                            <Link to="/admin/categories/new" className="text-indigo-600 hover:underline">
                                                Add one
                                            </Link>
                                            .
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{cat.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{cat.description || "—"}</td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                <Link
                                                    to={`/admin/categories/${cat.id}/edit`}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium mr-3"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
