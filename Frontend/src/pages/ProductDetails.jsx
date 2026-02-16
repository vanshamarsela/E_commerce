import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useParams, Link } from "wouter";
import { useCart } from "../hooks/useCart";
import { formatINR } from "../lib/currency.js";

export const ProductDetails = () => {
    const [id, setId] = useState(null);
    const params = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { addToCart } = useCart();

    useEffect(() => {
        setId(params.id);
    }, [params]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/products/${id}`);
                setProduct(response.data);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            // alert('Product added to cart!');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-600">{error}</p>
                    <Link to="/products" className="text-blue-600 hover:underline mt-4 inline-block">
                        ← Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-gray-600">Product not found</p>
                    <Link to="/products" className="text-blue-600 hover:underline mt-4 inline-block">
                        ← Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link to="/products" className="text-blue-600 hover:underline mb-6 inline-block">
                ← Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={product.thumbnail || product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Additional Images */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto">
                            {product.images.slice(1).map((image, index) => (
                                <div key={index} className="shrink-0 w-20 h-20 rounded border-2 border-gray-200 overflow-hidden">
                                    <img
                                        src={image}
                                        alt={`${product.name} ${index + 2}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    <div>
                        <div className="mb-2">
                            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                {product.category_rel?.name || 'Uncategorized'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {product.name}
                        </h1>
                        <p className="text-lg text-gray-600 mb-4">
                            {product.description}
                        </p>
                        {product.brand && (
                            <p className="text-sm text-gray-500 mb-2">by {product.brand}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-3xl font-bold text-green-600">
                                {formatINR(product.price)}
                            </span>
                            {product.discount_percentage > 0 && (
                                <span className="text-lg text-red-500 line-through">
                                    {formatINR(product.price / (1 - product.discount_percentage / 100))}
                                </span>
                            )}
                        </div>
                        {product.rating > 0 && (
                            <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-lg font-semibold">{product.rating.toFixed(1)}</span>
                                <span className="text-gray-500">({product.reviews?.length || 0} reviews)</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold text-gray-900">SKU</h3>
                            <p className="text-gray-600">{product.sku || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Stock</h3>
                            <p className="text-gray-600">{product.stock_quantity} available</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Weight</h3>
                            <p className="text-gray-600">{product.weight} kg</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Status</h3>
                            <p className={`text-sm font-semibold ${product.availability_status === 'In Stock' ? 'text-green-600' : 'text-red-600'}`}>
                                {product.availability_status}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Warranty</h3>
                            <p className="text-gray-600">{product.warranty_information}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Shipping</h3>
                            <p className="text-gray-600">{product.shipping_information}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Return Policy</h3>
                            <p className="text-gray-600">{product.return_policy}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Min Order Qty</h3>
                            <p className="text-gray-600">{product.minimum_order_quantity}</p>
                        </div>
                    </div>

                    {product.dimensions && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Dimensions</h3>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="bg-gray-50 p-2 rounded text-center">
                                    <div className="font-semibold">{product.dimensions.width} cm</div>
                                    <div className="text-gray-600">Width</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded text-center">
                                    <div className="font-semibold">{product.dimensions.height} cm</div>
                                    <div className="text-gray-600">Height</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded text-center">
                                    <div className="font-semibold">{product.dimensions.depth} cm</div>
                                    <div className="text-gray-600">Depth</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {product.tags && product.tags.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock_quantity === 0}
                        className={`w-full py-3 px-6 rounded-lg transition font-semibold ${
                            product.stock_quantity === 0
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>

            {/* Reviews Section */}
            {product.reviews && product.reviews.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Reviews ({product.reviews.length})</h2>
                    <div className="space-y-4">
                        {product.reviews.map((review, index) => (
                            <div key={review.id || index} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-semibold">{review.reviewer_name}</span>
                                        <span className="text-sm text-gray-500">{review.reviewer_email}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                                                ⭐
                                            </span>
                                        ))}
                                        <span className="text-sm text-gray-600 ml-1">({review.rating})</span>
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="text-gray-700 mb-2">{review.comment}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {new Date(review.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};
