import { api as client } from "./client";

export const getAuditLogs = async () => {
  const res = await client.get("/audit-logs");
  return res.data;
};
