import { api } from "./client";

export async function login(username, password) {
  const body = new URLSearchParams({ username, password });

  const res = await api.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // backend מחזיר access_token
  const token = res.data.access_token;

  // שמרי token ואז תביאי user מ-/auth/me
  localStorage.setItem("token", token);

  const meRes = await api.get("/auth/me"); // עובד כי ה-interceptor ישלח Authorization
  const user = meRes.data;

  return { token, user };
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
export async function register(data) {
  const res = await api.post("/auth/register", data);
  return res.data;
}
