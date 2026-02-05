import { api } from "./client";

// ✅ LOGIN
export async function login(username, password) {
  const body = new URLSearchParams({ username, password });
  const res = await api.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

// ✅ REGISTER
export async function register(username, password, role = "customer") {
  const res = await api.post("/auth/register", { username, password, role });
  return res.data;
}

// ✅ ME
export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
