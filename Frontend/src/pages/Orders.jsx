import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "../lib/api.js";
import { formatINR } from "../lib/currency.js";

const statusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-indigo-100 text-indigo-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/orders/", { params: { skip: 0, limit: 50 } });
        setOrders(res.data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.detail || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">You have no orders yet.</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Link to="/products" className="text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const itemCount = order.order_items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
          return (
            <Link key={order.id} to={`/orders/${order.id}`} className="block">
              <div className="border rounded-lg p-5 bg-white shadow hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-500">Order #{order.id}</div>
                    <div className="text-gray-800">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="text-sm text-gray-600">{itemCount} items</div>
                    <div className="text-lg font-semibold text-green-700">
                      {formatINR(order.total_amount || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;

