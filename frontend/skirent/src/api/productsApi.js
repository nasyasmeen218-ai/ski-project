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

export async function takeProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/take`, {
    qty: Number(qty),
  });
  return res.data;
}

export async function returnTakenProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-taken`, {
    qty: Number(qty),
  });
  return res.data;
}

export async function rentProduct(productId, days, qty = 1) {
  const res = await api.post(`/products/${productId}/rent`, {
    qty: Number(qty),
    days: Number(days),
  });
  return res.data;
}

export async function returnRentedProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-rented`, {
    qty: Number(qty),
  });
  return res.data;
}
