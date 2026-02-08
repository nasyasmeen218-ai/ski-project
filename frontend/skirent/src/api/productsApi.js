import api from "./client";

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
