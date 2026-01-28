import { useState } from "react";
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

function AppContent() {
  const { user, isAuthenticated } = useAuth();

  const [showRegister, setShowRegister] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [currentView, setCurrentView] = useState("products");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);

  // ✅ SINGLE SOURCE OF TRUTH
  const [products, setProducts] = useState(mockProducts);

  const handleRental = (productId, days) => {
    toast.success(`Product rented for ${days} days successfully!`);
    console.log("Rental:", productId, days);
  };

  const handleTake = (productId) => {
    toast.success("Product taken successfully!");
    console.log("Take:", productId);
  };

  const handleReturn = (productId) => {
    toast.success("Product returned successfully!");
    console.log("Return:", productId);
  };

  const handleDeleteProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Product deleted successfully!");
    console.log("Delete:", productId);
  };

  const handleAddProduct = (productData) => {
    const newProduct = {
      id: `p${Date.now()}`, // simple unique id
      ...productData,
      quantity: Number(productData.quantity || 0),
      availableQuantity: Number(productData.availableQuantity || 0),
      rentedQuantity: Number(productData.rentedQuantity || 0),
    };

    setProducts((prev) => [newProduct, ...prev]);
    toast.success("Product added successfully!");
    console.log("Add Product:", newProduct);
  };

  const handleEditProduct = (productId, updatedFields) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p))
    );
    toast.success("Product updated successfully!");
    console.log("Edit Product:", productId, updatedFields);
  };

  // Not authenticated: Login/Register
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onBackClick={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            toast.success("Registered successfully! You can now sign in");
          }}
        />
      );
    }
    return <Login onRegisterClick={() => setShowRegister(true)} />;
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        onAddProductClick={
          user?.role === "admin" ? () => setShowAddProductDialog(true) : undefined
        }
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
            <AdminProducts
              products={products}
              onDelete={handleDeleteProduct}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
            />
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
      <AppContent />
    </AuthProvider>
  );
}
