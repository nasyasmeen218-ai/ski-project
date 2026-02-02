import { api } from "./client";

// ✅ LOGIN
export async function login(username, password) {
  const res = await api.post("/auth/login", { username, password });
  return res.data;
}

// ✅ REGISTER
// אם הבאקאנד שלך יוצר תמיד employee, פשוט תמחקי את role מה-body
export async function register(username, password, role = "employee") {
  const res = await api.post("/auth/register", { username, password, role });
  return res.data;
}

// ✅ ME
export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
