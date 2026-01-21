import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Navbar from "./components/Navbar";
import EmployeeProducts from "./pages/EmployeeProducts";
import AdminProducts from "./pages/AdminProducts";
import AuditLogs from "./pages/AuditLogs";

import ActivityDrawer from "./components/ActivityDrawer";
import ProductFormDialog from "./components/ProductFormDialog";

import { toast, Toaster } from "sonner";

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [currentView, setCurrentView] = useState<'products' | 'audit'>('products');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);

  const handleRental = (productId: string, days: number) => {
    toast.success(`Product rented for ${days} days successfully!`);
    console.log('Rental:', productId, days);
  };

  const handleTake = (productId: string) => {
    toast.success('Product taken successfully!');
    console.log('Take:', productId);
  };

  const handleReturn = (productId: string) => {
    toast.success('Product returned successfully!');
    console.log('Return:', productId);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      toast.success('Product deleted successfully!');
      console.log('Delete:', productId);
    }
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    toast.success('Product added successfully!');
    console.log('Add Product:', product);
  };

  const handleEditProduct = (productId: string, product: Partial<Product>) => {
    toast.success('Product updated successfully!');
    console.log('Edit Product:', productId, product);
  };

  // If not authenticated, show login or register
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onBackClick={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            toast.success('Registered successfully! You can now sign in');
          }}
        />
      );
    }
    return <Login onRegisterClick={() => setShowRegister(true)} />;
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />

      {/* Navbar */}
      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        onAddProductClick={user?.role === 'admin' ? () => setShowAddProductDialog(true) : undefined}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 h-14 items-center">
            <button
              onClick={() => setCurrentView('products')}
              className={`text-sm font-medium transition-all pb-4 ${
                currentView === 'products'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Products
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('audit')}
                className={`text-sm font-medium transition-all pb-4 ${
                  currentView === 'audit'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inventory Reports
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {currentView === 'products' &&
          (user?.role === 'employee' ? (
            <EmployeeProducts
              onRental={handleRental}
              onTake={handleTake}
              onReturn={handleReturn}
            />
          ) : (
            <AdminProducts
              onDelete={handleDeleteProduct}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
            />
          ))}
        {currentView === 'audit' && user?.role === 'admin' && <AuditLogs />}
      </main>

      {/* Activity Drawer */}
      {showActivityDrawer && (
        <ActivityDrawer onClose={() => setShowActivityDrawer(false)} />
      )}

      {/* Add Product Dialog for Admin */}
      {showAddProductDialog && user?.role === 'admin' && (
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