import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminApi } from "../../lib/api.js";
import AdminLayout from "../../layouts/AdminLayout.jsx";

const defaultForm = {
    name: "",
    description: "",
    category_id: null,
    price: "",
    discount_percentage: "0",
    stock_quantity: "0",
    tags: "",
    brand: "",
    sku: "",
    weight: "",
    warranty_information: "",
    shipping_information: "",
    availability_status: "In Stock",
    return_policy: "",
    minimum_order_quantity: "1",
    images: "",
    thumbnail: "",
};

// TODO - REMOVE: dummy prefilled values for add product form
const dummyProductForm = {
    name: "Sample Product",
    description: "Sample product description for testing.",
    category_id: null,
    price: "49.99",
    discount_percentage: "10",
    stock_quantity: "25",
    tags: "sample, test",
    brand: "Sample Brand",
    sku: "SMP-001",
    weight: "0.5",
    warranty_information: "1 year warranty",
    shipping_information: "Ships in 2-3 days",
    availability_status: "In Stock",
    return_policy: "30 days return",
    minimum_order_quantity: "1",
    images: "https://via.placeholder.com/400",
    thumbnail: "https://via.placeholder.com/200",
};

function productToForm(p) {
    if (!p) return defaultForm;
    return {
        name: p.name ?? "",
        description: p.description ?? "",
        category_id: p.category_id ?? p.category_rel?.id ?? null,
        price: p.price ?? "",
        discount_percentage: String(p.discount_percentage ?? "0"),
        stock_quantity: String(p.stock_quantity ?? "0"),
        tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
        brand: p.brand ?? "",
        sku: p.sku ?? "",
        weight: p.weight != null ? String(p.weight) : "",
        warranty_information: p.warranty_information ?? "",
        shipping_information: p.shipping_information ?? "",
        availability_status: p.availability_status ?? "In Stock",
        return_policy: p.return_policy ?? "",
        minimum_order_quantity: String(p.minimum_order_quantity ?? "1"),
        images: Array.isArray(p.images) ? p.images.join(", ") : "",
        thumbnail: p.thumbnail ?? "",
    };
}

export default function AdminProductForm() {
    const params = useParams();
    const productId = params?.id ? Number(params.id) : null;
    const isEdit = Boolean(productId);

    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(() => (isEdit ? defaultForm : dummyProductForm));
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [, navigate] = useLocation();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [catRes, productRes] = await Promise.all([
                    adminApi.get("/admin/categories/"),
                    isEdit ? adminApi.get(`/admin/products/${productId}`) : Promise.resolve({ data: null }),
                ]);
                setCategories(catRes.data || []);
                if (isEdit && productRes?.data) {
                    setForm(productToForm(productRes.data));
                }
            } catch (err) {
                setError(err.response?.data?.detail || (isEdit ? "Failed to load product" : "Failed to load categories"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [productId, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayload = () => {
        const tags = form.tags
            ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [];
        const images = form.images
            ? form.images.split(",").map((u) => u.trim()).filter(Boolean)
            : [];
        return {
            name: form.name.trim(),
            description: form.description.trim() || null,
            category_id: form.category_id ? Number(form.category_id) : null,
            price: Number(form.price),
            discount_percentage: Number(form.discount_percentage) || 0,
            stock_quantity: Number(form.stock_quantity) || 0,
            tags,
            brand: form.brand.trim() || null,
            sku: form.sku.trim() || null,
            weight: form.weight ? Number(form.weight) : null,
            warranty_information: form.warranty_information.trim() || null,
            shipping_information: form.shipping_information.trim() || null,
            availability_status: form.availability_status || "In Stock",
            return_policy: form.return_policy.trim() || null,
            minimum_order_quantity: Number(form.minimum_order_quantity) || 1,
            images,
            thumbnail: form.thumbnail.trim() || null,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const payload = buildPayload();
            if (isEdit) {
                await adminApi.put(`/admin/products/${productId}`, payload);
            } else {
                await adminApi.post("/admin/products/", payload);
            }
            navigate("/admin/products");
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(Array.isArray(detail) ? detail.map((x) => x.msg).join(", ") : detail || (isEdit ? "Failed to update product" : "Failed to create product"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <p className="text-slate-500">Loading...</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-2xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link to="/admin/products" className="text-sm text-slate-500 hover:text-slate-700">
                        ← Products
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Edit product" : "Add Product"}</h1>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Basic</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                name="category_id"
                                value={form.category_id ?? ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">— None —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Discount %</label>
                                <input
                                    name="discount_percentage"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={form.discount_percentage}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock quantity</label>
                                <input
                                    name="stock_quantity"
                                    type="number"
                                    min="0"
                                    value={form.stock_quantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Min order qty</label>
                                <input
                                    name="minimum_order_quantity"
                                    type="number"
                                    min="1"
                                    value={form.minimum_order_quantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Availability status</label>
                            <select
                                name="availability_status"
                                value={form.availability_status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="In Stock">In Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                                <option value="Preorder">Preorder</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                                <input
                                    name="brand"
                                    value={form.brand}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                <input
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
                            <input
                                name="weight"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.weight}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
                            <input
                                name="tags"
                                value={form.tags}
                                onChange={handleChange}
                                placeholder="electronics, wireless"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Warranty</label>
                            <input
                                name="warranty_information"
                                value={form.warranty_information}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Shipping info</label>
                            <input
                                name="shipping_information"
                                value={form.shipping_information}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Return policy</label>
                            <input
                                name="return_policy"
                                value={form.return_policy}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Images</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Image URLs (comma-separated)</label>
                            <input
                                name="images"
                                value={form.images}
                                onChange={handleChange}
                                placeholder="https://..., https://..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail URL</label>
                            <input
                                name="thumbnail"
                                value={form.thumbnail}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : isEdit ? "Update product" : "Create product"}
                        </button>
                        <Link
                            to="/admin/products"
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
