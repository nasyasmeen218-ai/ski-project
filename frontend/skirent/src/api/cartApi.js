import api from "./client";

// GET /cart
export async function getMyCart() {
  const res = await api.get("/cart");
  return res.data;
}

// POST /cart  { product_id, qty, is_rental, rental_days, rental_price }
export async function addToCart(productId, qty = 1, isRental = false, rentalDays = 1, rentalPrice = null) {
  const res = await api.post("/cart", { 
    product_id: productId, 
    qty,
    is_rental: isRental,
    rental_days: rentalDays,
    rental_price: rentalPrice
  });
  return res.data;
}

// PATCH /cart/{cart_item_id}  { qty }
export async function updateCartItemQty(cartItemId, qty) {
  const res = await api.patch(`/cart/${cartItemId}`, { qty });
  return res.data;
}

// DELETE /cart/{cart_item_id}
export async function deleteCartItem(cartItemId) {
  const res = await api.delete(`/cart/${cartItemId}`);
  return res.data;
}

// POST /cart/checkout
export async function checkout() {
  const res = await api.post("/cart/checkout");
  return res.data;
}
