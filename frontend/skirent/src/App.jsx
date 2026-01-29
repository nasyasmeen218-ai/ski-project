import { useMemo, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./components/pages/Login";
import Register from "./components/pages/Register";

import Navbar from "./components/layouts/header/Navbar";
import EmployeeProducts from "./components/pages/EmployeeProducts";
import AdminProducts from "./components/pages/AdminProducts";
import AuditLogs from "./components/pages/AuditLogs";

import ActivityDrawer from "./components/layouts/header/ActivityDrawer";

import { toast, Toaster } from "sonner";

function AppContent() {
  const { user, isAuthenticated, isLoadingUser, logout, refreshMe } = useAuth();

  const [showRegister, setShowRegister] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [currentView, setCurrentView] = useState("products");

  // signal to open "Add Product" dialog inside AdminProducts
  const [addSignal, setAddSignal] = useState(0);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const isEmployee = useMemo(() => user?.role === "employee", [user]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Not authenticated: Login/Register
  if (!isAuthenticated) {
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
        onLoginSuccess={async () => {
          await refreshMe?.();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onActivityClick={() => setShowActivityDrawer(true)}
        onAddProductClick={isAdmin ? () => setAddSignal((n) => n + 1) : undefined}
        onLogoutClick={logout}
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
        {currentView === "products" && (
          <>
            {isEmployee && <EmployeeProducts />}
            {isAdmin && <AdminProducts addSignal={addSignal} />}
          </>
        )}

        {currentView === "audit" && isAdmin && <AuditLogs />}
      </main>

      {showActivityDrawer && (
        <ActivityDrawer onClose={() => setShowActivityDrawer(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />
      <AppContent />
    </AuthProvider>
  );
}
