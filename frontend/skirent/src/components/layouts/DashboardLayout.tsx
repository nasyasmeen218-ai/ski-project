import { useMemo, useState } from "react";
import { toast } from "sonner";

import Navbar from "../layouts/header/Navbar";
import ActivityDrawer from "../layouts/header/ActivityDrawer";
import ProductFormDialog from "./layout/ProductFormDialog";

import { createProduct } from "../../api/productsApi";

export default function DashboardLayout({
  user,
  currentView,
  setCurrentView,
  children,
  onLogout,
  onProductCreated,
}: {
  user: any;
  currentView: string;
  setCurrentView: (v: string) => void;
  children: React.ReactNode;
  onLogout: () => void;
  onProductCreated?: () => void;
}) {
  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddProductClick = () => {
    if (!isAdmin) return;
    setShowAddDialog(true);
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      setSaving(true);

      const payload = {
        name: productData.name,
        category: productData.category,
        gender: productData.gender,
        type: productData.type,
        quantity: Number(productData.quantity ?? 0),
        availableQuantity: Number(productData.availableQuantity ?? 0),
        rentedQuantity: Number(productData.rentedQuantity ?? 0),
      };

      await createProduct(payload);

      toast.success("Product added");
      setShowAddDialog(false);
      setCurrentView("products");
      onProductCreated?.();
    } catch (e: any) {
      console.error(e);

      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;

      if (status === 409) {
        toast.error(detail || "Product already exists");
      } else {
        toast.error(detail || "Failed to add product");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        onAddProductClick={isAdmin ? handleAddProductClick : undefined}
        onLogoutClick={onLogout}
      />

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

            {isAdmin && (
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
        {children}
      </main>

      {showActivityDrawer && (
        <ActivityDrawer onClose={() => setShowActivityDrawer(false)} />
      )}

      {showAddDialog && (
        <ProductFormDialog
          mode="add"
          product={null}
          onConfirm={handleCreateProduct}
          onClose={() => {
            if (!saving) setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
}
