import { api } from "./client";

// ✅ GET /rentals/my
export async function getMyRentals() {
  const res = await api.get("/rentals/my");
  return res.data;
}

// ✅ GET /rentals (admin) with optional filters
// params example: { status: "ACTIVE", userId: "...", productId: "..." }
export async function getAllRentals(params) {
  const res = await api.get("/rentals", { params });
  return res.data;
}
