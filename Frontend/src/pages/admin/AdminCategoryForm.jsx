import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { adminApi } from "../../lib/api.js";
import AdminLayout from "../../layouts/AdminLayout.jsx";

export default function AdminCategoryForm() {
    const params = useParams();
    const [, navigate] = useLocation();
    const id = params?.id ? Number(params.id) : null;
    const isEdit = Boolean(id);

    // TODO - REMOVE: dummy prefilled values for add form
    const dummyCategory = { name: "Sample Category", description: "Sample description for testing." };
    const [form, setForm] = useState(() => (isEdit ? { name: "", description: "" } : dummyCategory));
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                const res = await adminApi.get(`/admin/categories/${id}`);
                const cat = res.data;
                setForm({ name: cat.name, description: cat.description || "" });
            } catch (err) {
                setError(err.response?.data?.detail || "Failed to load category");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            if (isEdit) {
                await adminApi.put(`/admin/categories/${id}`, form);
            } else {
                await adminApi.post("/admin/categories/", form);
            }
            navigate("/admin/categories");
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to save category");
        } finally {
            setSubmitting(false);
        }
    };

    if (isEdit && loading) {
        return (
            <AdminLayout>
                <p className="text-slate-500">Loading...</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link to="/admin/categories" className="text-sm text-slate-500 hover:text-slate-700">
                        ← Categories
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isEdit ? "Edit category" : "Add category"}
                    </h1>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Category name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Optional description"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
                        </button>
                        <Link
                            to="/admin/categories"
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
