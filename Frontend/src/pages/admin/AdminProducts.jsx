import { useState, useEffect } from "react";
import { Link } from "wouter";
import { adminApi } from "../../lib/api.js";
import AdminLayout from "../../layouts/AdminLayout.jsx";

const defaultLimit = 20;

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [skip, setSkip] = useState(0);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await adminApi.get("/admin/products/", {
                params: { skip, limit: defaultLimit },
            });
            setProducts(res.data || []);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [skip]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete product "${name}"?`)) return;
        try {
            await adminApi.delete(`/admin/products/${id}`);
            await loadProducts();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to delete");
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                    <Link
                        to="/admin/products/new"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                    >
                        Add product
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">
                                            No products. <Link to="/admin/products/new" className="text-indigo-600 hover:underline">Add one</Link>.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                                {p.category_rel?.name ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">₹{Number(p.price).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{p.stock_quantity}</td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                <Link
                                                    to={`/admin/products/${p.id}/edit`}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium mr-3"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(p.id, p.name)}
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
                        disabled={products.length < defaultLimit}
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
