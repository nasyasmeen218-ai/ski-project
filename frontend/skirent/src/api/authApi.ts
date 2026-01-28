import { api } from "./client";

export type LoginResponse = {
  token: string;
  user: { id: string; username: string; role: "admin" | "employee" };
};

export async function login(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", { username, password });
  return res.data;
}

export async function register(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/register", { username, password });
  return res.data;
}

export async function me() {
  const res = await api.get<{ id: string; username: string; role: "admin" | "employee" }>("/auth/me");
  return res.data;
}
