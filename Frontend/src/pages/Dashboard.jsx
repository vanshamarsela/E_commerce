import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { api } from "../lib/api.js";
import { formatINR } from "../lib/currency.js";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("profile"); // profile | orders | payments
    const [, navigate] = useLocation();

    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Check if we have an access token
                const token = localStorage.getItem("access_token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                // Get user info
                const userResponse = await api.get("/auth/me");
                setUser(userResponse.data);

                // Get user sessions
                const sessionsResponse = await api.get("/auth/sessions");
                setSessions(sessionsResponse.data);

                // Load orders for dashboard sections
                const ordersResponse = await api.get("/orders/", { params: { skip: 0, limit: 50 } });
                setOrders(ordersResponse.data || []);

                // Load payments for Payment tab
                const paymentsResponse = await api.get("/payments/", { params: { skip: 0, limit: 100 } });
                setPayments(paymentsResponse.data || []);
            } catch (err) {
                console.error("Error loading user data:", err);
                if (err.response?.status === 401) {
                    // Access + refresh both failed => session is logged out (interceptor redirects too)
                    localStorage.removeItem("access_token");
                    navigate("/login");
                    return;
                }
                setError("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    const paidOrdersCount = useMemo(() => {
        return (orders || []).filter((o) => o.payment_status === "paid").length;
    }, [orders]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            localStorage.removeItem("access_token");
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
            // Force logout on frontend even if backend call fails
            localStorage.removeItem("access_token");
            navigate("/");
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            // Refresh sessions list
            const sessionsResponse = await api.get("/auth/sessions");
            setSessions(sessionsResponse.data);
        } catch (err) {
            console.error("Error revoking session:", err);
            setError("Failed to revoke session");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
                <div className="border rounded-lg bg-white p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm text-gray-500">Signed in as</div>
                            <div className="font-semibold text-gray-900">{user?.username}</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold"
                        >
                            Logout
                        </button>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`w-full text-left px-3 py-2 rounded ${activeTab === "profile" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("orders")}
                            className={`w-full text-left px-3 py-2 rounded ${activeTab === "orders" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                        >
                            My Orders
                        </button>
                        <button
                            onClick={() => setActiveTab("payments")}
                            className={`w-full text-left px-3 py-2 rounded ${activeTab === "payments" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                        >
                            Payment
                        </button>
                    </nav>

                    <div className="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                            <span>Total orders</span>
                            <span className="font-semibold">{orders.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Paid orders</span>
                            <span className="font-semibold">{paidOrdersCount}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <section className="lg:col-span-3 space-y-6">
                {activeTab === "profile" && (
                    <>
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Profile</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{user?.full_name || "Not provided"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user?.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}>
                                        {user?.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold">Active Sessions ({sessions.length})</h2>
                            </div>

                            {sessions.length === 0 ? (
                                <p className="text-gray-500">No active sessions</p>
                            ) : (
                                <div className="space-y-4">
                                    {sessions.map((session) => (
                                        <div key={session.id} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">OS:</span>
                                                    <p className="text-gray-900">{session.os || "Unknown"}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Browser:</span>
                                                    <p className="text-gray-900">{session.browser || "Unknown"}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Device:</span>
                                                    <p className="text-gray-900">{session.device || "Unknown"}</p>
                                                </div>
                                                <div className="flex items-end justify-between gap-3">
                                                    <div>
                                                        <span className="font-medium text-gray-700">Type:</span>
                                                        <p className="text-gray-900">{session.is_mobile ? "Mobile" : "Desktop"}</p>
                                                    </div>
                                                    {/* <button
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        className="text-sm text-red-600 hover:text-red-700 font-semibold"
                                                    >
                                                        Revoke
                                                    </button> */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "orders" && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">My Orders</h2>
                            <Link to="/orders" className="text-sm text-blue-600 hover:underline">
                                View all
                            </Link>
                        </div>

                        {orders.length === 0 ? (
                            <p className="text-gray-600">You have no orders yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {orders.slice(0, 8).map((order) => (
                                    <Link key={order.id} to={`/orders/${order.id}`} className="block">
                                        <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                <div>
                                                    <div className="text-sm text-gray-500">Order #{order.id}</div>
                                                    <div className="text-sm text-gray-700">
                                                        {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                                        {order.payment_status}
                                                    </span>
                                                    <span className="text-sm font-semibold text-green-700">
                                                        {formatINR(order.total_amount || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "payments" && (
                    <div className="bg-white shadow rounded-lg p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Payment</h2>
                        {payments.length === 0 ? (
                            <div className="border rounded-lg p-4 bg-gray-50 text-gray-700">
                                No payment attempts yet.
                            </div>
                        ) : (
                            <div className="overflow-hidden">
                                <div className="divide-y">
                                    {payments.map((p) => {
                                        const statusStyle =
                                            p.status === "success"
                                                ? "bg-green-100 text-green-800"
                                                : p.status === "failed"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800";

                                        const amountInr = (Number(p.amount_paise || 0) / 100);

                                        return (
                                            <div key={p.id} className="px-4 py-4">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}`}>
                                                                {p.status}
                                                            </span>
                                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                                                {p.provider}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-700 mt-2">
                                                            Order:{" "}
                                                            <Link to={`/orders/${p.order_id}`} className="text-blue-600 hover:underline">
                                                                #{p.order_id}
                                                            </Link>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="font-semibold text-gray-900">
                                                            {formatINR(amountInr)}
                                                        </div>
                                                        {p.razorpay_payment_id && (
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                Payment ID: {p.razorpay_payment_id}
                                                            </div>
                                                        )}
                                                        {p.razorpay_order_id && (
                                                            <div className="text-xs text-gray-600">
                                                                Razorpay Order: {p.razorpay_order_id}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {(p.status === "failed") && (p.error_description || p.error_code) && (
                                                    <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3">
                                                        <div className="font-semibold">Failure</div>
                                                        {p.error_code && <div className="text-xs mt-1">Code: {p.error_code}</div>}
                                                        {p.error_description && <div className="mt-1">{p.error_description}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;