import api from "./client";

export async function register(username, password) {
  const res = await api.post("/auth/register", { username, password });
  return res.data;
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const res = await api.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return res.data; // { access_token, token_type }
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
