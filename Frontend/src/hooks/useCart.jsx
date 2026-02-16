import { createContext, useContext, useState, useEffect } from 'react';
import { api } from "../lib/api.js";
import { useAuth } from "./useAuth.jsx";

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    // Initialize cart from localStorage
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
                return [];
            }
        }
        return [];
    });

    // Save cart to localStorage whenever cartItems changes
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const mapBackendCartToLocal = (backendCart) => {
        const items = backendCart?.cart_items || [];
        return items
            .filter(ci => ci?.product)
            .map(ci => ({ ...ci.product, quantity: ci.quantity }));
    };

    const fetchBackendCart = async () => {
        const res = await api.get("/cart/");
        return res.data;
    };

    // On login: merge local cart into backend cart once per user, then use backend as source of truth
    useEffect(() => {
        const syncOnLogin = async () => {
            if (!isAuthenticated || !user?.id) return;

            const syncKey = `cart_synced_user_${user.id}`;
            const alreadySynced = localStorage.getItem(syncKey) === "true";

            try {
                if (!alreadySynced && cartItems.length > 0) {
                    // Merge local -> backend by incrementing quantities
                    await Promise.all(
                        cartItems.map((item) =>
                            api.post("/cart/items/", {
                                product_id: item.id,
                                quantity: Number(item.quantity || 1),
                            })
                        )
                    );
                    localStorage.setItem(syncKey, "true");
                }

                const backendCart = await fetchBackendCart();
                setCartItems(mapBackendCartToLocal(backendCart));
            } catch (error) {
                console.error("Cart sync failed:", error);
            }
        };

        syncOnLogin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id]);

    const addToCart = async (product) => {
        // optimistic local update
        setCartItems(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });

        if (isAuthenticated) {
            try {
                const res = await api.post("/cart/items/", { product_id: product.id, quantity: 1 });
                setCartItems(mapBackendCartToLocal(res.data));
            } catch (error) {
                console.error("Failed to add to backend cart:", error);
            }
        }
    };

    const removeFromCart = async (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));

        if (isAuthenticated) {
            try {
                const res = await api.delete(`/cart/items/${productId}`);
                setCartItems(mapBackendCartToLocal(res.data));
            } catch (error) {
                console.error("Failed to remove from backend cart:", error);
            }
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prev =>
            prev.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );

        if (isAuthenticated) {
            try {
                const res = await api.put(`/cart/items/${productId}`, { quantity: newQuantity });
                setCartItems(mapBackendCartToLocal(res.data));
            } catch (error) {
                console.error("Failed to update backend cart:", error);
            }
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    };

    const getCartItemCount = () => {
        return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    };

    const clearCart = async () => {
        setCartItems([]);

        if (isAuthenticated) {
            try {
                await api.delete("/cart/");
            } catch (error) {
                console.error("Failed to clear backend cart:", error);
            }
        }
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartItemCount,
        clearCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};