import { Link } from "wouter";
import AdminLayout from "../layouts/AdminLayout.jsx";

const AdminPanel = () => {
    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600 mb-8">
                Welcome to the admin panel. Manage categories and products from the sidebar.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-medium text-slate-900 mb-1">Users</h3>
                    <p className="text-sm text-slate-500 mb-4">View registered users</p>
                    <Link to="/admin/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        User list →
                    </Link>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-medium text-slate-900 mb-1">Categories</h3>
                    <p className="text-sm text-slate-500 mb-4">Manage product categories</p>
                    <Link to="/admin/categories" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        List →
                    </Link>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-medium text-slate-900 mb-1">Add Category</h3>
                    <p className="text-sm text-slate-500 mb-4">Create a new category</p>
                    <Link to="/admin/categories/new" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        Add category →
                    </Link>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-medium text-slate-900 mb-1">Products</h3>
                    <p className="text-sm text-slate-500 mb-4">View and manage catalog</p>
                    <Link to="/admin/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        List →
                    </Link>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-medium text-slate-900 mb-1">Add Product</h3>
                    <p className="text-sm text-slate-500 mb-4">Create a new product</p>
                    <Link to="/admin/products/new" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        Add product →
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPanel;
