import { api } from "./client";

export type Product = {
  id: string;
  name: string;
  category?: string; // clothing/equipment
  type?: string;
  gender?: string;   // male/female (לבגדים)
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
// ✅ POST /products/{id}/take
export async function takeProduct(productId: string): Promise<any> {
  const res = await api.post(`/products/${productId}/take`);
  return res.data;
}

// ✅ POST /products/{id}/return-taken
export async function returnTakenProduct(productId: string): Promise<any> {
  const res = await api.post(`/products/${productId}/return-taken`);
  return res.data;
}

// ✅ POST /products/{id}/rent  { days }
export async function rentProduct(productId: string, days: number): Promise<any> {
  const res = await api.post(`/products/${productId}/rent`, { days });
  return res.data;
}

// ✅ POST /products/{id}/return-rented
export async function returnRentedProduct(productId: string): Promise<any> {
  const res = await api.post(`/products/${productId}/return-rented`);
  return res.data;
}
