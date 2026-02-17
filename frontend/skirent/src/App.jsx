import { useMemo, useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { toast, Toaster } from "sonner";

import Login from "./components/pages/Login";
import Register from "./components/pages/Register";

import EmployeeProducts from "./components/pages/EmployeeProducts";
import AdminProducts from "./components/pages/AdminProducts";
import AuditLogs from "./components/pages/AuditLogs";
import AdminEmployees from "./components/pages/AdminEmployees";
import AdminReports from "./components/pages/AdminReports";
import AdminCustomers from "./components/pages/AdminCustomers";

import CustomerProducts from "./components/pages/CustomerProducts";
import CartView from "./components/pages/CartView";
import MyOrders from "./components/pages/MyOrders";

import Dashboard from "./components/pages/Dashboard";
import DashboardLayout from "./components/layouts/DashboardLayout";

function AppContent() {
  const { user, isAuthenticated, isLoadingUser, logout, refreshMe } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // ✅ מסך נחיתה חדש כברירת מחדל אחרי התחברות
  const [currentView, setCurrentView] = useState("dashboard");

  const [refreshProductsSignal, setRefreshProductsSignal] = useState(0);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const isEmployee = useMemo(() => user?.role === "employee", [user]);
  const isCustomer = useMemo(() => user?.role === "customer", [user]);

  // ✅ אם המשתמש התחבר עכשיו (או ריפרש), נוודא שנוחתים על Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView("dashboard");
    }
  }, [isAuthenticated]);

  // ✅ חסימת גישה למסכים של אדמין למי שלא אדמין (כולל reports + customers)
  useEffect(() => {
    if (
      !isAdmin &&
      (currentView === "audit" ||
        currentView === "employees" ||
        currentView === "reports" ||
        currentView === "customers")
    ) {
      setCurrentView("products");
    }
  }, [isAdmin, currentView]);

  // ✅ הגנה קטנה: אם currentView לא מוכר (מונע מסך ריק)
  useEffect(() => {
    const allowed = new Set([
      "dashboard",
      "products",
      "cart",
      "orders",
      "reports",
      "audit",
      "employees",
      "customers",
    ]);
    if (!allowed.has(currentView)) {
      setCurrentView("dashboard");
    }
  }, [currentView]);

  // ✅ מאפשר ל-CartView להעביר אותך ל-Orders אחרי Checkout
  useEffect(() => {
    const handler = () => setCurrentView("orders");
    window.addEventListener("goToOrders", handler);
    return () => window.removeEventListener("goToOrders", handler);
  }, []);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

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
          // ✅ אחרי לוגין: נחיתה בדאשבורד
          setCurrentView("dashboard");
        }}
      />
    );
  }

  return (
    <DashboardLayout
      user={user}
      currentView={currentView}
      setCurrentView={setCurrentView}
      onLogout={logout}
      onProductCreated={() => setRefreshProductsSignal((n) => n + 1)}
      onCartClick={() => setCurrentView("cart")}
      onOrdersClick={() => setCurrentView("orders")}
      onLogoClick={() => setCurrentView("dashboard")} // ✅ חדש: לחיצה על לוגו -> Dashboard
    >
      {/* ✅ Dashboard / Landing */}
      {currentView === "dashboard" && (
        <Dashboard user={user} setCurrentView={setCurrentView} />
      )}

      {currentView === "products" && (
        <>
          {isEmployee && <EmployeeProducts />}
          {isAdmin && <AdminProducts refreshSignal={refreshProductsSignal} />}
          {isCustomer && <CustomerProducts />}
        </>
      )}

      {currentView === "cart" && isCustomer && <CartView />}
      {currentView === "orders" && isCustomer && <MyOrders />}

      {/* ✅ Admin only views */}
      {currentView === "reports" && isAdmin && <AdminReports />}
      {currentView === "audit" && isAdmin && <AuditLogs />}
      {currentView === "employees" && isAdmin && <AdminEmployees />}
      {currentView === "customers" && isAdmin && <AdminCustomers />}
    </DashboardLayout>
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
