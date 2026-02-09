import { useMemo, useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { toast, Toaster } from "sonner";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import EmployeeProducts from "./components/pages/EmployeeProducts";
import AdminProducts from "./components/pages/AdminProducts";
import AuditLogs from "./components/pages/AuditLogs";
import AdminEmployees from "./components/pages/AdminEmployees";
import CustomerProducts from "./components/pages/CustomerProducts";
import CartView from "./components/pages/CartView";
import MyOrders from "./components/pages/MyOrders";
import DashboardLayout from "./components/layouts/DashboardLayout";

function AppContent() {
  const { user, isAuthenticated, isLoadingUser, logout, refreshMe } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState("products");
  const [refreshProductsSignal, setRefreshProductsSignal] = useState(0);
  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const isEmployee = useMemo(() => user?.role === "employee", [user]);
  const isCustomer = useMemo(() => user?.role === "customer", [user]);

  // ✅ חסימת גישה למסכים של אדמין למי שלא אדמין
  useEffect(() => {
    if (!isAdmin && (currentView === "audit" || currentView === "employees")) {
      setCurrentView("products");
    }
  }, [isAdmin, currentView]);

  // ✅ מאפשר ל-CartView להעביר אותך ל-Orders אחרי Checkout בלחיצת כפתור
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
    >
      {currentView === "products" && (
        <>
          {isEmployee && <EmployeeProducts />}
          {isAdmin && <AdminProducts refreshSignal={refreshProductsSignal} />}
          {isCustomer && <CustomerProducts />}
        </>
      )}

      {currentView === "cart" && isCustomer && <CartView />}
      {currentView === "orders" && isCustomer && <MyOrders />}
      {currentView === "audit" && isAdmin && <AuditLogs />}
      {currentView === "employees" && isAdmin && <AdminEmployees />}
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
