import { useAuth } from "../../../context/AuthContext";
import { LogOut, User, Activity } from "lucide-react";
import { useState } from "react";
import logo from "../../../assets/logo.png";

export default function Navbar({ onActivityClick, onAddProductClick }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SkiRent" className="h-10 w-auto" />
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "admin" && onAddProductClick && (
              <button
                onClick={onAddProductClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Product
              </button>
            )}

            <button
              onClick={onActivityClick}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              title="Recent Activities"
              type="button"
            >
              <Activity className="w-6 h-6" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all"
                type="button"
              >
                <span className="text-sm font-medium">Hi, {user?.name}</span>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Role:{" "}
                        {user?.role === "admin" ? "Administrator" : "Employee"}
                      </p>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                        type="button"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
