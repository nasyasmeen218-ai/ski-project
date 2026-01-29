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

// ✅ GET /products
export async function getProducts(): Promise<Product[]> {
  const res = await api.get<Product[]>("/products");
  return res.data;
}

// ✅ POST /products (Admin)
export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const res = await api.post<Product>("/products", payload);
  return res.data;
}

// ✅ PUT /products/{id} (Admin)
export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const res = await api.put<Product>(`/products/${id}`, payload);
  return res.data;
}

// ✅ DELETE /products/{id} (Admin)
export async function deleteProduct(id: string): Promise<{ ok?: boolean; message?: string }> {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}

// --- Inventory / Rentals actions ---
// ✅ POST /products/{id}/take  { qty }
export async function takeProduct(productId: string, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/take`, { qty });
  return res.data;
}

// ✅ POST /products/{id}/return-taken  { qty }
export async function returnTakenProduct(productId: string, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/return-taken`, { qty });
  return res.data;
}

// ✅ POST /products/{id}/rent  { qty, days }
export async function rentProduct(productId: string, days: number, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/rent`, { qty, days });
  return res.data;
}

// ✅ POST /products/{id}/return-rented  { qty }
export async function returnRentedProduct(productId: string, qty: number = 1): Promise<any> {
  const res = await api.post(`/products/${productId}/return-rented`, { qty });
  return res.data;
}
