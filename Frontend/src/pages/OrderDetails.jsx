import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { api } from "../lib/api.js";
import { formatINR } from "../lib/currency.js";

const badgeColor = (status) => {
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

const OrderDetails = () => {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/orders/${params.id}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.detail || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchOrder();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>
        <p className="text-gray-600">Loading order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/orders" className="text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>
        <p className="text-gray-600 mb-4">Order not found</p>
        <Link to="/orders" className="text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <Link to="/orders" className="text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Placed</div>
                <div className="text-gray-800">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                  payment: {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <p className="text-gray-700 whitespace-pre-line">{order.shipping_address}</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <p className="text-gray-700">{order.payment_method}</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            <div className="space-y-4">
              {(order.order_items || []).map((item) => (
                <div key={item.id} className="flex gap-4 border rounded-lg p-4 bg-gray-50">
                  <div className="w-20 h-20 shrink-0 rounded overflow-hidden bg-white border">
                    <img
                      src={item.product?.thumbnail || item.product?.images?.[0]}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grow">
                    <Link to={`/products/${item.product_id}`} className="font-semibold text-blue-600 hover:underline">
                      {item.product?.name || `Product #${item.product_id}`}
                    </Link>
                    <div className="text-sm text-gray-600 mt-1">
                      Qty: {item.quantity} · Price: {formatINR(item.price)}
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatINR(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 bg-gray-50 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{formatINR(order.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
            </div>
            <hr className="my-4" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatINR(order.total_amount || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

