import { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./components/pages/Login";
import Register from "./components/pages/Register";

import Navbar from "./components/layouts/header/Navbar";
import EmployeeProducts from "./components/pages/EmployeeProducts";
import AdminProducts from "./components/pages/AdminProducts";
import AuditLogs from "./components/pages/AuditLogs";
import ProductFormDialog from "./components/layouts/layout/ProductFormDialog";

import ActivityDrawer from "./components/layouts/header/ActivityDrawer";

import { toast, Toaster } from "sonner";
import { mockProducts } from "./types/types";

/**
 * Safer localStorage access (prevents "Access is denied" crashes in edge cases)
 */
function safeGetToken() {
  try {
    return localStorage.getItem("token");
  } catch (e) {
    console.warn("Cannot access localStorage token:", e);
    return null;
  }
}

function AppContent() {
  const { user } = useAuth();

  const [showRegister, setShowRegister] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [currentView, setCurrentView] = useState("products");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);

  // ✅ SINGLE SOURCE OF TRUTH (currently mock; later replace with API state)
  const [products, setProducts] = useState(mockProducts);

  // Auth gate based on token (source of truth for your axios interceptor)
  const [token, setToken] = useState(() => safeGetToken());
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setToken(safeGetToken());
    setAuthChecked(true);
  }, []);

  const isAuthed = useMemo(() => Boolean(token), [token]);

  // ✅ FIXED LOGOUT
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
    } catch (e) {
      console.warn("Cannot access localStorage:", e);
    }

    setToken(null);
    setShowRegister(false);
    setCurrentView("products");
    toast.success("Logged out", { position: "top-center" });
  };

  const handleRental = (productId, days) => {
    toast.success(`Product rented for ${days} days successfully!`, {
      position: "top-center",
    });
    console.log("Rental:", productId, days);
  };

  const handleTake = (productId) => {
    toast.success("Product taken successfully!", { position: "top-center" });
    console.log("Take:", productId);
  };

  const handleReturn = (productId) => {
    toast.success("Product returned successfully!", { position: "top-center" });
    console.log("Return:", productId);
  };

  const handleDeleteProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Product deleted successfully!", { position: "top-center" });
    console.log("Delete:", productId);
  };

  const handleAddProduct = (productData) => {
    const newProduct = {
      id: `p${Date.now()}`,
      ...productData,
      quantity: Number(productData.quantity || 0),
      availableQuantity: Number(productData.availableQuantity || 0),
      rentedQuantity: Number(productData.rentedQuantity || 0),
    };

    setProducts((prev) => [newProduct, ...prev]);
    toast.success("Product added successfully!", { position: "top-center" });
    console.log("Add Product:", newProduct);
  };

  const handleEditProduct = (productId, updatedFields) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p))
    );
    toast.success("Product updated successfully!", { position: "top-center" });
    console.log("Edit Product:", productId, updatedFields);
  };

  // Small guard to avoid flashing UI before checking localStorage
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Not authenticated: Login/Register
  if (!isAuthed) {
    if (showRegister) {
      return (
        <Register
          onBackClick={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            toast.success("Registered successfully! You can now sign in", {
              position: "top-center",
            });
          }}
        />
      );
    }

    return (
      <Login
        onRegisterClick={() => setShowRegister(true)}
        onLoginSuccess={() => setToken(safeGetToken())}
      />
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        onAddProductClick={
          user?.role === "admin" ? () => setShowAddProductDialog(true) : undefined
        }
        onLogoutClick={handleLogout}
      />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 h-14 items-end">
            <button
              onClick={() => setCurrentView("products")}
              className={`text-sm font-medium transition-all pb-4 ${
                currentView === "products"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              type="button"
            >
              Products
            </button>

            {user?.role === "admin" && (
              <button
                onClick={() => setCurrentView("audit")}
                className={`text-sm font-medium transition-all pb-4 ${
                  currentView === "audit"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                type="button"
              >
                Inventory Reports
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === "products" &&
          (user?.role === "employee" ? (
            <EmployeeProducts
              products={products}
              onRental={handleRental}
              onTake={handleTake}
              onReturn={handleReturn}
            />
          ) : (
            <AdminProducts />
          ))}

        {currentView === "audit" && user?.role === "admin" && <AuditLogs />}
      </main>

      {showActivityDrawer && (
        <ActivityDrawer onClose={() => setShowActivityDrawer(false)} />
      )}

      {showAddProductDialog && user?.role === "admin" && (
        <ProductFormDialog
          mode="add"
          onConfirm={(product) => {
            handleAddProduct(product);
            setShowAddProductDialog(false);
          }}
          onClose={() => setShowAddProductDialog(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* ✅ One global toaster for the entire app (Login/Register included) */}
      <Toaster position="top-center" richColors />
      <AppContent />
    </AuthProvider>
  );
}
