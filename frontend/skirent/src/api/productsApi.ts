import { api } from "./client";

export type Product = {
  id: string;
  name: string;
  category?: string; // clothing/equipment
  type?: string;
  gender?: string; // male/female (לבגדים)
  quantity: number;
  availableQuantity?: number;
  rentedQuantity?: number;
};

export type CreateProductPayload = Omit<Product, "id">;
export type UpdateProductPayload = Partial<Omit<Product, "id">>;

// ✅ GET /products - שליפת כל המוצרים
export async function getProducts(): Promise<Product[]> {
  const res = await api.get<Product[]>("/products");
  return res.data;
}

// ✅ POST /products (Admin) - יצירת מוצר חדש
export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const res = await api.post<Product>("/products", payload);
  return res.data;
}

// ✅ PUT /products/{id} (Admin) - עדכון מוצר
export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const res = await api.put<Product>(`/products/${id}`, payload);
  return res.data;
}

// ✅ DELETE /products/{id} (Admin) - מחיקת מוצר
export async function deleteProduct(id: string): Promise<{ ok?: boolean; message?: string }> {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}

// --- Inventory / Actions (משימה 3 והלאה) ---

// ✅ POST /products/{id}/take - לקיחת מוצר למלאי מיידי
export async function takeProduct(productId: string, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/take`, { qty });
  return res.data;
}

// ✅ POST /products/{id}/return - החזרת מוצר שנלקח (תיקנו את הנתיב ל-return)
export async function returnTakenProduct(productId: string, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/return`, { qty });
  return res.data;
}

// ✅ GET /products/audit-logs - שליפת דוחות המלאי (הפונקציה שהוספנו לטבלה)
export async function getAuditLogs(): Promise<any[]> {
  const res = await api.get("/products/audit-logs");
  return res.data;
}

// --- Rental Actions (למקרה שהן נשארות פה ולא ב-RentalsApi) ---

// ✅ POST /products/{id}/rent - השכרת מוצר (חובה לשלוח days ו-qty)
export async function rentProduct(productId: string, days: number, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/rent`, { qty, days });
  return res.data;
}

// ✅ POST /products/{id}/return-rented - החזרת מוצר מהשכרה
export async function returnRentedProduct(productId: string, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/return-rented`, { qty });
  return res.data;
}