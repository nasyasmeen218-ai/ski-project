import { api } from "./client";

export type Role = "admin" | "employee";

export type User = {
  id?: string;
  username: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  user: User;
};

// ✅ LOGIN
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", { username, password });
  return res.data;
}

// ✅ REGISTER
// לא מניחים שהבקאנד מחזיר token בהרשמה. רק יוצרים משתמש.
export async function register(
  username: string,
  password: string,
  role: Role = "employee"
): Promise<{ message?: string; user?: User }> {
  const res = await api.post("/auth/register", { username, password, role });
  return res.data;
}

// ✅ ME
export async function me(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}
