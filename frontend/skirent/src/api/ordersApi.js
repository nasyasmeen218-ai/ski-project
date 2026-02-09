import api from "./client";

// GET /orders/my
export async function getMyOrders() {
  const res = await api.get("/orders/my");
  return res.data;
}
