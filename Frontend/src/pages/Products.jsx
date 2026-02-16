import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "../lib/api.js";
import { formatINR } from "../lib/currency.js";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10;

    const fetchProducts = async (skipValue = 0, append = false) => {
        try {
            setLoading(true);
            const res = await api.get('/products/', {
                params: {
                    limit,
                    skip: skipValue
                }
            });

            const newProducts = res.data;

            if (newProducts.length < limit) {
                setHasMore(false);
            }

            if (append) {
                setProducts(prev => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(0, false);
    }, []);

    const loadMore = () => {
        const newSkip = skip + limit;
        setSkip(newSkip);
        fetchProducts(newSkip, true);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-5xl font-black text-center mb-16 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
                    Our Collection
                </span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        className="group"
                    >
                        <div className="glass-card overflow-hidden h-full flex flex-col hover:translate-y-[-8px] transition-all duration-500">
                            <div className="relative aspect-square overflow-hidden">
                                <img
                                    src={product.thumbnail || product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                    <span className="text-white font-medium text-sm">View Details →</span>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="bg-blue-600/80 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold">
                                        {product.category_rel?.name || 'Exclusive'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-grow">
                                <h2 className="font-bold text-xl mb-2 text-white group-hover:text-blue-400 transition-colors">
                                    {product.name}
                                </h2>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed">
                                    {product.description}
                                </p>
                                <div className="flex justify-between items-center mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-white">
                                            {formatINR(product.price || 0)}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                            {product.brand}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {(loading || hasMore) && (
                <div className="mt-20 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-300 bg-blue-600 rounded-full group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Discovering...
                            </span>
                        ) : (
                            "Show More Masterpieces"
                        )}
                    </button>
                </div>
            )}

            {!hasMore && products.length > 0 && (
                <div className="mt-20 text-center">
                    <p className="text-gray-400 font-medium italic">You've reached the end of our current collection</p>
                </div>
            )}
        </div>
    );
};

export default Products;