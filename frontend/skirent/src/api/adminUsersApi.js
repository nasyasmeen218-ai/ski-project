import { api } from "./client";

export const getAdminUsers = async () => {
  const res = await api.get("/admin/users");
  return res.data;
};

export const blockUser = async (userId) => {
  const res = await api.patch(`/admin/users/${userId}/block`);
  return res.data;
};

export const unblockUser = async (userId) => {
  const res = await api.patch(`/admin/users/${userId}/unblock`);
  return res.data;
};

export const getUserActions = async (userId) => {
  const res = await api.get(`/admin/users/${userId}/actions`);
  return res.data;
};
