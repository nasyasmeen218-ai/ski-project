import { api } from "./client";

export type Rental = {
  id: string;
  product_id: string;
  user_id: string;
  status: "ACTIVE" | "RETURNED";
  rented_at?: string;
  returned_at?: string;
  days?: number;
};

// ✅ GET /rentals/my
export async function getMyRentals(): Promise<Rental[]> {
  const res = await api.get<Rental[]>("/rentals/my");
  return res.data;
}

// ✅ GET /rentals (Admin)
export async function getAllRentals(): Promise<Rental[]> {
  const res = await api.get<Rental[]>("/rentals");
  return res.data;
}
