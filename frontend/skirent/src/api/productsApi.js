import { api } from "./client";

// ✅ GET /products - שליפת כל המוצרים מהשרת
export async function getProducts() {
  const res = await api.get("/products");
  return res.data;
}

// ✅ POST /products (Admin) - יצירת מוצר חדש במערכת
export async function createProduct(payload) {
  const res = await api.post("/products", payload);
  return res.data;
}

// ✅ PUT /products/{id} (Admin) - עדכון פרטים של מוצר קיים
export async function updateProduct(id, payload) {
  const res = await api.put(`/products/${id}`, payload);
  return res.data;
}

// ✅ DELETE /products/{id} (Admin) - מחיקת מוצר מהמערכת
export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}

// --- ניהול מלאי (Inventory) ---

// ✅ POST /products/{id}/take - לקיחת מוצר מהמלאי הזמין
export async function takeProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/take`, { qty });
  return res.data;
}

// ✅ POST /products/{id}/return - החזרת מוצר שנלקח חזרה למלאי
export async function returnTakenProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return`, { qty });
  return res.data;
}

// ✅ GET /products/audit-logs - שליפת היסטוריית שינויים במלאי (דוחות)
export async function getAuditLogs() {
  const res = await api.get("/products/audit-logs");
  return res.data;
}

// --- פעולות השכרה (Rentals) ---

// ✅ POST /products/{id}/rent - השכרת מוצר (דורש ימי השכרה וכמות)
export async function rentProduct(productId, days, qty = 1) {
  const res = await api.post(`/products/${productId}/rent`, { qty, days });
  return res.data;
}

// ✅ POST /products/{id}/return-rented - החזרת מוצר שהיה בהשכרה
export async function returnRentedProduct(productId, qty = 1) {
  const res = await api.post(`/products/${productId}/return-rented`, { qty });
  return res.data;
}