import { useMemo, useState } from "react";
import { toast } from "sonner";

import Navbar from "../layouts/header/Navbar";
import ActivityDrawer from "../layouts/header/ActivityDrawer";

export default function DashboardLayout({
  user,
  currentView,
  setCurrentView,
  children,
  onLogout,
  onProductCreated,
  onCartClick,
  onOrdersClick,
  onLogoClick, // ✅ חדש
}) {
  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        onLogoutClick={onLogout}
        onCartClick={onCartClick}
        onOrdersClick={onOrdersClick}
        onLogoClick={onLogoClick} // ✅ חדש: הלוגו מפעיל ניווט לדאשבורד
        hideAddProductButton={currentView === "dashboard"} // ✅ אופציונלי: להסתיר +Add Product בדאשבורד
      />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 h-14 items-end">
            {/* ✅ חדש: Dashboard */}
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`text-sm font-medium transition-all pb-4 ${
                currentView === "dashboard"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              type="button"
            >
              Dashboard
            </button>

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

            {/* ✅ Inventory Reports -> reports */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView("reports")}
                className={`text-sm font-medium transition-all pb-4 ${
                  currentView === "reports"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                type="button"
              >
                Inventory Reports
              </button>
            )}

            {/* ✅ Audit Logs -> audit */}
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
                Audit Logs
              </button>
            )}

            {/* ✅ Employees -> employees */}
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

            {/* ✅ Customers -> customers */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView("customers")}
                className={`text-sm font-medium transition-all pb-4 ${
                  currentView === "customers"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                type="button"
              >
                Customers
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
    </div>
  );
}
