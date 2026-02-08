import api from "./client";

export async function getAuditLogs() {
  const res = await api.get("/audit-logs");
  return res.data;
}
