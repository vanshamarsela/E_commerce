import { Link, useLocation } from "wouter";
import { useAdminAuth } from "../hooks/useAdminAuth.jsx";

const navItems = [
    { to: "/admin", label: "Dashboard", exact: true },
    { to: "/admin/users", label: "Users", exact: false },
    { to: "/admin/categories", label: "Categories", exact: false },
    { to: "/admin/categories/new", label: "Add Category", exact: true },
    { to: "/admin/products", label: "Products", exact: false },
    { to: "/admin/products/new", label: "Add Product", exact: true },
];

export default function AdminLayout({ children }) {
    const { admin, adminLogout } = useAdminAuth();
    const [location] = useLocation();

    const isActive = (to, exact) => {
        if (exact) return location === to;
        return location === to || (location.startsWith(to + "/") && to !== "/admin");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200">
                    <Link to="/admin" className="text-lg font-semibold text-slate-900 hover:text-indigo-600">
                        Admin Panel
                    </Link>
                </div>
                <nav className="flex-1 p-3 space-y-0.5">
                    {navItems.map(({ to, label, exact }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                                isActive(to, exact)
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="p-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-2 truncate px-2" title={admin?.email}>
                        {admin?.full_name || admin?.username}
                    </div>
                    <button
                        type="button"
                        onClick={adminLogout}
                        className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Log out
                    </button>
                    <Link
                        to="/"
                        className="block mt-1 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-100"
                    >
                        ← Store
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
                    <span className="text-sm text-slate-500">Admin</span>
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
