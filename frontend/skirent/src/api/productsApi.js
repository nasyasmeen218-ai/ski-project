import api from "./client";

// =========================
// CRUD
// =========================
export async function getProducts() {
  const res = await api.get("/products");
  return res.data;
}

export async function createProduct(payload) {
  const res = await api.post("/products", payload);
  return res.data;
}

export async function updateProduct(productId, payload) {
  const res = await api.put(`/products/${productId}`, payload);
  return res.data;
}

export async function deleteProduct(productId) {
  const res = await api.delete(`/products/${productId}`);
  return res.data;
}

// =========================
// Stock / Rental actions (Employee)
// =========================

// take from stock: POST /products/{id}/take { qty }
export async function takeProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/take`, { qty });
  return res.data;
}

// return taken: POST /products/{id}/return-taken { qty }
export async function returnTakenProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-taken`, { qty });
  return res.data;
}

// rent: POST /products/{id}/rent { qty, days }
export async function rentProduct(productId, days, qty = 1) {
  const res = await api.post(`/products/${productId}/rent`, { qty, days });
  return res.data;
}

// return rented: POST /products/{id}/return-rented { qty }
export async function returnRentedProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-rented`, { qty });
  return res.data;
}
