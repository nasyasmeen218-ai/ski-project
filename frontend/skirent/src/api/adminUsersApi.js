import api from "./client";

export async function getAdminUsers() {
  const res = await api.get("/admin/users");
  return res.data;
}

export async function blockUser(userId) {
  const res = await api.patch(`/admin/users/${userId}/block`);
  return res.data;
}

export async function unblockUser(userId) {
  const res = await api.patch(`/admin/users/${userId}/unblock`);
  return res.data;
}

export async function promoteToAdmin(userId) {
  const res = await api.patch(`/admin/users/${userId}/make-admin`);
  return res.data;
}

export async function getUserActions(userId) {
  const res = await api.get(`/admin/users/${userId}/actions`);
  return res.data;
}
