import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  getCart,
  updateCartItemQty,
  deleteCartItem,
  checkout as checkoutApi,
} from "../../api/cartApi";

export default function CartView() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCartItems(data);
    } catch (err) {
      toast.error("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const changeQty = async (cartItemId, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItemQty(cartItemId, newQty);
      await fetchCart();
    } catch (err) {
      toast.error("Could not update quantity");
    }
  };

  const handleDelete = async (cartItemId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    try {
      await deleteCartItem(cartItemId);
      toast.success("Item removed");
      await fetchCart();
    } catch (err) {
      toast.error("Could not remove item. Please try again.");
    }
  };

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  }, [cartItems]);

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      await checkoutApi();
      toast.success("Checkout completed!");
      await fetchCart();
    } catch (err) {
      toast.error("Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Go find some awesome ski gear!</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Shopping Cart</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {cartItems.map((item) => (
            <li key={item.id} className="p-6 flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.imageurl ? (
                  <img
                    src={item.imageurl}
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
                <h3 className="font-bold text-lg text-gray-800">{item.product_name}</h3>
                <p className="text-blue-600 font-semibold">₪{item.price}</p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <button
                  onClick={() => changeQty(item.id, item.qty - 1)}
                  className="p-1 hover:text-blue-600 transition-colors"
                  type="button"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="font-bold w-6 text-center">{item.qty}</span>

                <button
                  onClick={() => changeQty(item.id, item.qty + 1)}
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
            <span className="text-3xl font-black text-gray-900">₪{totalPrice}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            type="button"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
