import { api } from "./client";

// ✅ GET /products
export async function getProducts() {
  const res = await api.get("/products");
  return res.data;
}

// ✅ POST /products (Admin)
export async function createProduct(payload) {
  const res = await api.post("/products", payload);
  return res.data;
}

// ✅ PUT /products/{id} (Admin)
export async function updateProduct(id, payload) {
  const res = await api.put(`/products/${id}`, payload);
  return res.data;
}

// ✅ DELETE /products/{id} (Admin)
export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}

// ✅ POST /products/{id}/take  { qty }
export async function takeProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/take`, { qty });
  return res.data;
}

// ✅ POST /products/{id}/return-taken  { qty }
export async function returnTakenProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-taken`, { qty });
  return res.data;
}

// ✅ POST /products/{id}/rent  { qty, days }
export async function rentProduct(productId, days, qty = 1) {
  const res = await api.post(`/products/${productId}/rent`, { qty, days });
  return res.data;
}

// ✅ POST /products/{id}/return-rented  { qty }
export async function returnRentedProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-rented`, { qty });
  return res.data;
}
