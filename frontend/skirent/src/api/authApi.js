import api from "./client";

export async function register(username, password) {
  const res = await api.post("/auth/register", {
    username: String(username || "").trim(),
    password: String(password || "").trim(),
  });
  return res.data;
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", String(username || "").trim());
  form.append("password", String(password || "").trim());

  const res = await api.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // ✅ הכי חשוב: לשמור token בדיוק בשם שה-client.js מחפש
  const token = res.data?.access_token;
  if (token) localStorage.setItem("token", token);

  return res.data;
}

export async function logout() {
  localStorage.removeItem("token");
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
