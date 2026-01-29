import { api } from "./client";

export type RentalDto = {
  id: string;
  productId: string;
  productName: string | null;
  qty: number;
  status: "ACTIVE" | "RETURNED" | string;
  startDate: string;
  endDate: string;
  returnedAt: string | null;
  createdAt: string;
};

export type AdminRentalDto = RentalDto & {
  userId: string;
};

// ✅ GET /rentals/my
export async function getMyRentals(): Promise<RentalDto[]> {
  const res = await api.get<RentalDto[]>("/rentals/my");
  return res.data;
}

// ✅ GET /rentals (admin) with optional filters
export async function getAllRentals(params?: {
  status?: string;   // ACTIVE / RETURNED
  userId?: string;
  productId?: string;
}): Promise<AdminRentalDto[]> {
  const res = await api.get<AdminRentalDto[]>("/rentals", { params });
  return res.data;
}
