import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  getMyCart,
  updateCartItemQty,
  deleteCartItem,
  checkout as checkoutApi,
} from "../../api/cartApi";

import OrderSuccessMessage from "../ui/OrderSuccessMessage";

function showApiError(err, fallback = "Something went wrong") {
  if (!err?.response)
    return "Cannot reach server. Make sure backend is running (port 8000)";

  const status = err.response.status;
  const rawDetail = err?.response?.data?.detail ?? err?.response?.data?.message;
  const detail =
    typeof rawDetail === "string"
      ? rawDetail
      : Array.isArray(rawDetail)
      ? rawDetail.map((x) => x?.msg).join(", ")
      : "";

  if (status === 401) return "Unauthorized (please login again)";
  if (status === 403) return "Forbidden (role not allowed)";
  if (status === 404) return "Not found";
  if (status === 409) return detail || "Conflict";
  if (status === 422) return detail || "Invalid request";
  if (status >= 500) return "Server error. Try again";
  return detail || fallback;
}

// Promise timeout כדי שלא ניתקע על Loading לנצח
function withTimeout(promise, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Request timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export default function CartView() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);

  const fetchCart = async () => {
    setLoading(true);

    try {
      const data = await withTimeout(getMyCart(), 8000);
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      // timeout
      if (String(err?.message || "").toLowerCase().includes("timeout")) {
        toast.error("Cart request timed out. Check backend / network.");
        setCartItems([]);
        return;
      }

      // 401/403 -> ננקה token
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        toast.error(showApiError(err), { duration: 4000 });
        toast.message("Please login again.");
        setCartItems([]);
        return;
      }

      toast.error(showApiError(err, "Failed to load cart items"));
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeQty = async (cartItemId, newQty) => {
    if (newQty < 1) return;
    try {
      await withTimeout(updateCartItemQty(cartItemId, newQty), 8000);
      await fetchCart();
    } catch (err) {
      toast.error(showApiError(err, "Could not update quantity"));
    }
  };

  const handleDelete = async (cartItemId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;

    try {
      await withTimeout(deleteCartItem(cartItemId), 8000);
      toast.success("Item removed");
      await fetchCart();
    } catch (err) {
      toast.error(showApiError(err, "Could not remove item. Please try again."));
    }
  };

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );
  }, [cartItems]);

  const handleCheckout = async () => {
    if (checkingOut) return;

    try {
      setCheckingOut(true);

      const order = await withTimeout(checkoutApi(), 15000);

      // ✅ נשמור orderId כדי להציג הודעת הצלחה יפה + כפתור Orders
      setLastOrderId(order?.id || null);

      // UX: לרוקן מסך מיד ואז להביא שוב מהשרת
      setCartItems([]);
      await fetchCart();
    } catch (err) {
      toast.error(showApiError(err, "Checkout failed"));
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading your cart...</div>;
  }

  // ✅ עגלה ריקה: מציגים קודם הודעת הצלחה (אם קיימת) ואז empty state
  if (cartItems.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {lastOrderId && (
          <OrderSuccessMessage
            orderId={lastOrderId}
            onViewOrders={() =>
              window.dispatchEvent(new CustomEvent("goToOrders"))
            }
          />
        )}

        <div className="flex flex-col items-center justify-center p-20 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-gray-500 mt-2">Go find some awesome ski gear!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* אם רוצים גם בזמן שיש items – אפשר להציג כאן,
          אבל כדי לא לבלבל משתמשים, נשאיר רק כשהעגלה ריקה אחרי checkout */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        My Shopping Cart
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {cartItems.map((item) => (
            <li key={item.id} className="p-6 flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.imageurl ? (
                  <img
                    src={
                      String(item.imageurl).startsWith("http")
                        ? item.imageurl
                        : `http://127.0.0.1:8000/${item.imageurl}`
                    }
                    className="object-contain h-full w-full"
                    alt={item.product_name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
                    }}
                  />
                ) : (
                  <ShoppingBag className="text-gray-300" />
                )}
              </div>

              <div className="flex-grow">
                <h3 className="font-bold text-lg text-gray-800">
                  {item.product_name}
                </h3>
                <p className="text-blue-600 font-semibold">
                  ₪{Number(item.price || 0).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <button
                  onClick={() => changeQty(item.id, Number(item.qty || 0) - 1)}
                  className="p-1 hover:text-blue-600 transition-colors"
                  type="button"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="font-bold w-6 text-center">
                  {Number(item.qty || 0)}
                </span>

                <button
                  onClick={() => changeQty(item.id, Number(item.qty || 0) + 1)}
                  className="p-1 hover:text-blue-600 transition-colors"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                type="button"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600 font-medium">Total Amount:</span>
            <span className="text-3xl font-black text-gray-900">
              ₪{totalPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            type="button"
          >
            {checkingOut ? "Processing..." : "Proceed to Checkout"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
