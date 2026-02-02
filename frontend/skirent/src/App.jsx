import { useMemo, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { toast, Toaster } from "sonner";

import Login from "./components/pages/Login";
import Register from "./components/pages/Register";

import EmployeeProducts from "./components/pages/EmployeeProducts";
import AdminProducts from "./components/pages/AdminProducts";
import AuditLogs from "./components/pages/AuditLogs";

import DashboardLayout from "./components/layouts/DashboardLayout";

function AppContent() {
  const { user, isAuthenticated, isLoadingUser, logout, refreshMe } = useAuth();

  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState("products");

  // כדי לרענן AdminProducts אחרי add product
  const [refreshProductsSignal, setRefreshProductsSignal] = useState(0);

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
    <DashboardLayout
      user={user}
      currentView={currentView}
      setCurrentView={setCurrentView}
      onLogout={logout}
      onProductCreated={() => setRefreshProductsSignal((n) => n + 1)}
    >
      {currentView === "products" && (
        <>
          {isEmployee && <EmployeeProducts />}
          {isAdmin && <AdminProducts refreshSignal={refreshProductsSignal} />}
        </>
      )}

      {currentView === "audit" && isAdmin && <AuditLogs />}
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
