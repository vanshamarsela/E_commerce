import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "../hooks/useCart";
import { api } from "../lib/api.js";
import { formatINR } from "../lib/currency.js";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [, navigate] = useLocation();

  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cartItems]
  );

  const total = useMemo(() => getCartTotal(), [getCartTotal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!shippingAddress.trim()) {
      setError("Please enter a shipping address.");
      return;
    }

    const orderPayload = {
      shipping_address: shippingAddress.trim(),
      payment_method: paymentMethod,
      order_items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity || 1),
      })),
    };

    try {
      setSubmitting(true);
      const res = await api.post("/orders/", orderPayload);
      const createdOrder = res.data;

      if (paymentMethod === "razorpay") {
        const ok = await loadRazorpayScript();
        if (!ok) {
          setError("Failed to load Razorpay. Please try again.");
          return;
        }

        const rp = await api.post("/payments/razorpay/order", { order_id: createdOrder.id });
        let paymentFinalized = false;

        const options = {
          key: rp.data.key_id,
          amount: rp.data.amount,
          currency: rp.data.currency || "INR",
          name: "SHDPIXEL",
          description: `Order #${createdOrder.id}`,
          order_id: rp.data.razorpay_order_id,
          handler: async (response) => {
            try {
              paymentFinalized = true;
              await api.post("/payments/razorpay/verify", {
                order_id: createdOrder.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await clearCart();
              navigate(`/orders/${createdOrder.id}`);
            } catch (err) {
              console.error("Payment verification failed:", err);
              try {
                await api.post("/payments/razorpay/fail", {
                  order_id: createdOrder.id,
                  razorpay_order_id: rp.data.razorpay_order_id,
                  error_code: "verification_failed",
                  error_description: err.response?.data?.detail || "Payment verification failed",
                });
              } catch {
                // ignore
              }
              setError(err.response?.data?.detail || "Payment verification failed.");
            }
          },
          modal: {
            ondismiss: async () => {
              if (!paymentFinalized) {
                try {
                  await api.post("/payments/razorpay/fail", {
                    order_id: createdOrder.id,
                    razorpay_order_id: rp.data.razorpay_order_id,
                    error_code: "cancelled",
                    error_description: "User cancelled the Razorpay checkout",
                  });
                } catch {
                  // ignore
                }
              }
              setError("Payment cancelled. You can retry from the order details page.");
            },
          },
        };

        const RazorpayCheckout = window.Razorpay;
        const razorpay = new RazorpayCheckout(options);
        razorpay.on("payment.failed", async (resp) => {
          if (paymentFinalized) return;
          try {
            await api.post("/payments/razorpay/fail", {
              order_id: createdOrder.id,
              razorpay_order_id: rp.data.razorpay_order_id,
              error_code: resp?.error?.code,
              error_description: resp?.error?.description || resp?.error?.reason || "Payment failed",
            });
          } catch {
            // ignore
          }
          setError(resp?.error?.description || "Payment failed. Please try again.");
        });
        razorpay.open();
        return;
      }

      await clearCart();
      navigate(`/orders/${createdOrder.id}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.response?.data?.detail || "Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">Your cart is empty.</p>
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
        <h1 className="text-3xl font-bold">Checkout</h1>
        <Link to="/cart" className="text-blue-600 hover:underline">
          ← Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={5}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter full address (street, city, state, zip, country)"
              />
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="razorpay">Razorpay</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                For Razorpay, payment is processed in INR and the order is marked paid after verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-6 rounded-lg transition font-semibold ${
                submitting ? "bg-gray-400 text-gray-100" : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 bg-gray-50 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="pr-4">
                    <div className="font-medium">{item.name || item.title}</div>
                    <div className="text-gray-500">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="font-medium">
                    {formatINR(item.price * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items ({itemCount})</span>
                <span>{formatINR(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
            </div>

            <hr className="my-4" />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

