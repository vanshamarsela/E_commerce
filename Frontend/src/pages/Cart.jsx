import { Link, useLocation } from "wouter";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { formatINR } from "../lib/currency.js";

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [, setLocation] = useLocation();

    const handleQuantityChange = (productId, newQuantity) => {
        const quantity = parseInt(newQuantity);
        if (quantity >= 0) {
            updateQuantity(productId, quantity);
        }
    };

    const handleRemoveItem = (productId) => {
        if (window.confirm('Are you sure you want to remove this item from your cart?')) {
            removeFromCart(productId);
        }
    };

    const handleClearCart = () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            clearCart();
        }
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            setLocation(`/login?forward-to=/checkout`);
        } else {
            setLocation(`/checkout`);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-center">Shopping Cart</h1>

                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                        Your cart is empty
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Add some products to get started!
                    </p>
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>
                <button
                    onClick={handleClearCart}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col sm:flex-row border rounded-lg p-4 bg-white shadow"
                        >
                            {/* Product Image */}
                            <div className="w-full sm:w-32 h-32 shrink-0 mb-4 sm:mb-0">
                                <img
                                    src={item.thumbnail || item.images?.[0]}
                                    alt={item.name || item.title}
                                    className="w-full h-full object-cover rounded"
                                />
                            </div>

                            {/* Product Details */}
                            <div className="grow sm:ml-4 space-y-2">
                                <Link
                                    to={`/products/${item.id}`}
                                    className="text-lg font-semibold text-blue-600 hover:underline"
                                >
                                    {item.name || item.title}
                                </Link>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                    {item.description}
                                </p>

                                <div className="flex items-center space-x-4">
                                    <span className="font-semibold text-green-600">
                                        {formatINR(item.price)}
                                    </span>
                                    <span className="text-yellow-500 flex items-center">
                                        ⭐ {typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating}
                                    </span>
                                </div>
                            </div>

                            {/* Quantity and Remove */}
                            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium">Qty:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity || 1}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        className="w-16 px-2 py-1 border rounded text-center"
                                    />
                                </div>

                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cart Summary */}
                <div className="lg:col-span-1">
                    <div className="border rounded-lg p-6 bg-gray-50 sticky top-4">
                        <h2 className="text-xl font-semibold mb-4">Cart Summary</h2>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span>Items ({cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}):</span>
                                <span>{formatINR(getCartTotal())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping:</span>
                                <span className="text-green-600">Free</span>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <div className="flex justify-between text-lg font-semibold mb-6">
                            <span>Total:</span>
                            <span>{formatINR(getCartTotal())}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold"
                        >
                            Proceed to Checkout
                        </button>

                        <Link
                            to="/products"
                            className="block text-center mt-4 text-blue-600 hover:underline"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;