import "./App.css";
import { Route, Switch, useLocation } from "wouter";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import { ProductDetails } from "./pages/ProductDetails";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminUsers from "./pages/admin/AdminUsers";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AdminAuthProvider, useAdminAuth } from "./hooks/useAdminAuth.jsx";
import { CartProvider } from "./hooks/useCart";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    navigate(`/login?forward-to=${encodeURIComponent(location)}`);
    return null;
  }

  return children;
}

// Admin Protected Route – requires admin authentication
function AdminProtectedRoute({ children }) {
  const { isAdminAuthenticated, loading } = useAdminAuth();
  const [location, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    navigate(`/admin/login?forward-to=${encodeURIComponent(location)}`);
    return null;
  }

  return children;
}

// Public Route Component (redirects to dashboard if already authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-4 text-gray-600">Loading...</div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return children;
}

function NotFound() {
  return (
    <MainLayout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 text-lg">Page not found</p>
      </div>
    </MainLayout>
  );
}



function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
      <CartProvider>
        <Switch>
        {/* Protected Routes - require authentication */}
        <Route path="/">
          <MainLayout>
            <Home />
          </MainLayout>
        </Route>

        <Route path="/about">
          <MainLayout>
            <About />
          </MainLayout>
        </Route>

        <Route path="/products">
          <MainLayout>
            <Products />
          </MainLayout>
        </Route>

        <Route path="/cart">
          <MainLayout>
            <Cart />
          </MainLayout>
        </Route>

        <Route path="/checkout">
          <ProtectedRoute>
            <MainLayout>
              <Checkout />
            </MainLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/orders/:id">
          <ProtectedRoute>
            <MainLayout>
              <OrderDetails />
            </MainLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/orders">
          <ProtectedRoute>
            <MainLayout>
              <Orders />
            </MainLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/products/:id">

          <MainLayout>
            <ProductDetails />
          </MainLayout>
        </Route>

        <Route path="/dashboard">
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        </Route>

        {/* Public Routes - accessible without authentication */}
        <Route path="/login">
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        </Route>

        <Route path="/register">
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login">
          <AdminLogin />
        </Route>
        <Route path="/admin/products/new">
          <AdminProtectedRoute>
            <AdminProductForm />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/products/:id/edit">
          <AdminProtectedRoute>
            <AdminProductForm />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/products">
          <AdminProtectedRoute>
            <AdminProducts />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/categories/new">
          <AdminProtectedRoute>
            <AdminCategoryForm />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/categories/:id/edit">
          <AdminProtectedRoute>
            <AdminCategoryForm />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/categories">
          <AdminProtectedRoute>
            <AdminCategories />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <AdminProtectedRoute>
            <AdminUsers />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin">
          <AdminProtectedRoute>
            <AdminPanel />
          </AdminProtectedRoute>
        </Route>

        {/* 404 Route */}
        <Route path="*">
          <NotFound />
        </Route>
        </Switch>
      </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
