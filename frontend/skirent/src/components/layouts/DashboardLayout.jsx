import { useMemo, useState } from "react";
import { toast } from "sonner";

import Navbar from "../layouts/header/Navbar";
import ActivityDrawer from "../layouts/header/ActivityDrawer";

// ❌ לא צריך יותר דיאלוג יצירה פה אם מוסיפים מתוך AdminProducts
// import ProductFormDialog from "./layout/ProductFormDialog";
// import { createProduct } from "../../api/productsApi";

export default function DashboardLayout({
  user,
  currentView,
  setCurrentView,
  children,
  onLogout,
  onProductCreated,
  onCartClick,
  onOrdersClick,
}) {
  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  // ❌ לא צריך יותר states של add dialog
  // const [showAddDialog, setShowAddDialog] = useState(false);
  // const [saving, setSaving] = useState(false);

  // ❌ לא צריך יותר create handlers
  // const handleAddProductClick = () => {
  //   if (!isAdmin) return;
  //   setShowAddDialog(true);
  // };

  // const handleCreateProduct = async (productData) => { ... }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        // ✅ חשוב: לא להעביר onAddProductClick -> הכפתור העליון ייעלם
        onLogoutClick={onLogout}
        onCartClick={onCartClick}
        onOrdersClick={onOrdersClick}
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

            {isAdmin && (
              <button
                onClick={() => setCurrentView("employees")}
                className={`text-sm font-medium transition-all pb-4 ${
                  currentView === "employees"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                type="button"
              >
                Employees
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

      {/* ❌ הוסר דיאלוג Add Product מכאן כדי שלא יהיה כפתור כפול */}
    </div>
  );
}
