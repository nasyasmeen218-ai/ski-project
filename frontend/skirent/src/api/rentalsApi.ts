import { api } from "./client";

// ✅ שליפת כל המוצרים למסך העובד והמנהל
export async function getProducts() {
  const res = await api.get("/products");
  return res.data;
}

// ✅ משימה 3: לקיחת מוצר (Take)
// הוספנו את ה-Body עם qty כדי שהבאקנד יוריד מהמלאי
export async function takeProduct(productId: string, qty: number = 1) {
  const res = await api.post(`/products/${productId}/take`, {
    qty: qty
  });
  return res.data;
}

// ✅ משימה 3: החזרת מוצר שנלקח (Return)
// משמש להחזרה מיידית של ציוד שנלקח ב-Take
export async function returnTakenProduct(productId: string, qty: number = 1) {
  const res = await api.post(`/products/${productId}/return`, {
    qty: qty
  });
  return res.data;
}

// ✅ שליפת דוחות המלאי (Audit Logs)
// הפונקציה החדשה שהוספנו כדי להציג מי לקח מה ומתי
export async function getAuditLogs() {
  const res = await api.get("/products/audit-logs");
  return res.data;
}

// ✅ פונקציות עזר לניהול (Admin)
export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}

export async function updateProduct(id: string, data: any) {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
}