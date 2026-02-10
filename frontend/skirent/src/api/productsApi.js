import api from "./client";

function normalizeProduct(product) {
  if (!product || typeof product !== "object") return null;

  const available = product.availableQuantity ?? product.available_quantity;
  const rented = product.rentedQuantity ?? product.rented_quantity;
  const taken = product.takenQuantity ?? product.taken_quantity;
  const imageurl = product.imageurl ?? product.imageUrl;

  return {
    ...product,
    availableQuantity: Number(available ?? 0),
    rentedQuantity: Number(rented ?? 0),
    takenQuantity: Number(taken ?? 0),
    imageurl,
  };
}

function extractProductPayload(data) {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    return data.map(normalizeProduct).filter(Boolean);
  }

  const candidate = data.product ?? data.data ?? data.item ?? data;
  const normalized = normalizeProduct(candidate);

  return normalized?.id ? normalized : null;
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
