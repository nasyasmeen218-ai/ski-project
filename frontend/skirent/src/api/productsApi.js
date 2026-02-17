import api from "./client";


function extractProductPayload(payload) {
  if (payload == null) return payload;

  if (Array.isArray(payload)) return payload;

  if (typeof payload !== "object") return payload;

  if (payload.product) return payload.product;
  if (payload.item) return payload.item;

  if (payload.data) {
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data?.product) return payload.data.product;
    if (payload.data?.item) return payload.data.item;
    return payload.data;
  }

  return payload;
}


// =========================
// CRUD
// =========================
export async function getProducts() {
  const res = await api.get("/products");
  const normalized = extractProductPayload(res.data);
  return Array.isArray(normalized) ? normalized : [];
}


export async function createProduct(payload) {
  const res = await api.post("/products", payload);
  return extractProductPayload(res.data) ?? res.data;
}


export async function updateProduct(productId, payload) {
  const res = await api.put(`/products/${productId}`, payload);
  return extractProductPayload(res.data) ?? res.data;
}


export async function deleteProduct(productId) {
  const res = await api.delete(`/products/${productId}`);
  return res.data;
}


// =========================
// Stock / Rental actions (Employee)
// =========================


export async function takeProduct(productId, qty = 1) {
  console.log("take prod: Taking product", { productId, qty });
  const res = await api.post(`/products/${productId}/take`, {
    qty: Number(qty),
  });
  return extractProductPayload(res.data) ?? res.data;
}


export async function returnTakenProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-taken`, {
    qty: Number(qty),
  });
  return extractProductPayload(res.data) ?? res.data;
}


export async function rentProduct(productId, days, qty = 1) {
  const res = await api.post(`/products/${productId}/rent`, {
    qty: Number(qty),
    days: Number(days),
  });
  return extractProductPayload(res.data) ?? res.data;
}


export async function returnRentedProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-rented`, {
    qty: Number(qty),
  });
  return extractProductPayload(res.data) ?? res.data;
}


