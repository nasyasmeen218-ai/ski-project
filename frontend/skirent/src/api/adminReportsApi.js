import api from "./client";

function buildParams({ from_date, to_date, limit } = {}) {
  const params = {};
  if (from_date) params.from_date = from_date; // ISO string
  if (to_date) params.to_date = to_date;       // ISO string
  if (limit) params.limit = limit;
  return params;
}

export async function getAdminKpi({ from_date, to_date } = {}) {
  const res = await api.get("/admin/reports/kpi", {
    params: buildParams({ from_date, to_date }),
  });
  return res.data;
}

export async function getTopProducts({ from_date, to_date, limit = 10 } = {}) {
  const res = await api.get("/admin/reports/top-products", {
    params: buildParams({ from_date, to_date, limit }),
  });
  return res.data;
}

export async function getCustomersReport({ from_date, to_date, limit = 25 } = {}) {
  const res = await api.get("/admin/reports/customers", {
    params: buildParams({ from_date, to_date, limit }),
  });
  return res.data;
}
