import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import GooeyNav from "./GooeyNav";
import { FiShoppingCart, FiSearch } from "react-icons/fi";
import { useState } from "react";

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const { getCartItemCount } = useCart();
    const [, navigate] = useLocation();
    const cartItemCount = getCartItemCount();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const navItems = [
        { 
            label: 'Home', 
            onClick: () => navigate('/') 
        },
        { 
            label: 'Products', 
            onClick: () => navigate('/products') 
        },
        { 
            label: (
                <div className="flex items-center gap-1">
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 h-4 flex items-center justify-center">
                            {cartItemCount}
                        </span>
                    )}
                </div>
            ), 
            onClick: () => navigate('/cart') 
        },
        ...(isAuthenticated ? [
            { 
                label: 'Dashboard', 
                onClick: () => navigate('/dashboard') 
            },
            { 
                label: 'Logout', 
                onClick: logout 
            }
        ] : [
            { 
                label: 'Login', 
                onClick: () => navigate('/login') 
            },
            { 
                label: 'Register', 
                onClick: () => navigate('/register') 
            }
        ])
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-md py-3">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center gap-8">
                    <div className="flex-shrink-0">
                        <Link to="/" className="group flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tighter text-white transition group-hover:text-blue-400">
                                SHD<span className="text-blue-500">PIXEL</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex-grow max-w-md hidden md:block">
                        <form onSubmit={handleSearch} className="relative group">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                            />
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        </form>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                        <GooeyNav items={navItems} />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar