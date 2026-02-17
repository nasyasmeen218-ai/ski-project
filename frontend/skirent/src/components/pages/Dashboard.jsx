export default function Dashboard({ user, setCurrentView }) {
  const role = user?.role;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white p-10 shadow-lg">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Welcome back, {user?.username || user?.name || "User"}!
              </h1>

              <p className="text-gray-300 leading-relaxed">
                Track, loan, and manage ski products with a clean, fast experience. Stay organized and
                keep everything moving.
              </p>

              {/* ✅ במקום You're an... */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">מה בא לך היום?</h2>

                <div className="flex flex-wrap gap-3">
                  {/* ✅ Admin actions */}
                  {role === "admin" && (
                    <>
                      <button
                        onClick={() => setCurrentView("products")}
                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-md font-medium"
                        type="button"
                      >
                        ➕ יצירת מוצר חדש
                      </button>

                      <button
                        onClick={() => setCurrentView("reports")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        📊 דוחות מלאי
                      </button>

                      <button
                        onClick={() => setCurrentView("employees")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        👥 ניהול עובדים
                      </button>

                      <button
                        onClick={() => setCurrentView("customers")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        🧍 ניהול לקוחות
                      </button>

                      <button
                        onClick={() => setCurrentView("audit")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        🕵️ Audit Logs
                      </button>
                    </>
                  )}

                  {/* ✅ Employee actions */}
                  {role === "employee" && (
                    <>
                      <button
                        onClick={() => setCurrentView("products")}
                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-md font-medium"
                        type="button"
                      >
                        📦 צפייה במלאי
                      </button>

                      <button
                        onClick={() => setCurrentView("audit")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        ⚡ פעולות אחרונות
                      </button>
                    </>
                  )}

                  {/* ✅ Customer actions */}
                  {role === "customer" && (
                    <>
                      <button
                        onClick={() => setCurrentView("products")}
                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-md font-medium"
                        type="button"
                      >
                        🛍️ מוצרים זמינים
                      </button>

                      <button
                        onClick={() => setCurrentView("cart")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        🛒 העגלה שלי
                      </button>

                      <button
                        onClick={() => setCurrentView("orders")}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur font-medium border border-white/10"
                        type="button"
                      >
                        📦 ההזמנות שלי
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ צד ימין - טיפ יפה */}
            <div className="hidden md:block">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 w-[320px]">
                <p className="text-sm text-gray-300 mb-2">Quick Tip</p>
                <p className="text-sm text-gray-200 leading-relaxed">
                  Click the logo anytime to return here.
                </p>
                <div className="mt-5 h-px bg-white/10" />
                <p className="mt-5 text-xs text-gray-400">
                  Inventory consistency is maintained automatically across Available / Rented / Taken.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ כרטיסים תחתונים - קצת יותר “פרימיום” */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Start here</p>
            <p className="mt-1 font-semibold text-gray-900">Dashboard Home</p>
            <p className="mt-2 text-sm text-gray-600">
              A clean landing page for navigation and status.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Navigation</p>
            <p className="mt-1 font-semibold text-gray-900">Logo → Dashboard</p>
            <p className="mt-2 text-sm text-gray-600">
              Standard UX pattern for web systems.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Next step</p>
            <p className="mt-1 font-semibold text-gray-900">Backend connect</p>
            <p className="mt-2 text-sm text-gray-600">
              We’ll wire real counts + recent activity from the API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
