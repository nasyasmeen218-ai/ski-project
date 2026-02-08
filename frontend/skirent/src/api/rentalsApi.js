import api from "./client";

// Admin: list all rentals
export async function getAllRentals() {
  const res = await api.get("/rentals/");
  return res.data;
}

// Customer: list my rentals
export async function getMyRentals() {
  const res = await api.get("/rentals/my");
  return res.data;
}
