import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import {
  getAdminKpi,
  getTopProducts,
  getCustomersReport,
} from "../../api/adminreportsapi";

function formatDateInput(d) {
  if (!d) return "";
  // keep YYYY-MM-DD
  return new Date(d).toISOString().slice(0, 10);
}

export default function AdminReports() {
  const [loading, setLoading] = useState(true);

  // date filters (optional)
  const [fromDate, setFromDate] = useState(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState("");     // YYYY-MM-DD

  // data
  const [kpi, setKpi] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const params = useMemo(() => {
    // backend expects ISO strings or None
    return {
      from_date: fromDate ? `${fromDate}T00:00:00` : undefined,
      to_date: toDate ? `${toDate}T23:59:59` : undefined,
    };
  }, [fromDate, toDate]);

  const loadAll = async () => {
    try {
      setLoading(true);

      const [kpiRes, topRes, custRes] = await Promise.all([
        getAdminKpi(params),
        getTopProducts({ ...params, limit: 10 }),
        getCustomersReport({ ...params, limit: 25 }),
      ]);

      setKpi(kpiRes || null);
      setTopProducts(Array.isArray(topRes?.rows) ? topRes.rows : []);
      setCustomers(Array.isArray(custRes?.rows) ? custRes.rows : []);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Failed to load reports");
      setKpi(null);
      setTopProducts([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="text-gray-600 text-sm mt-1">
            KPI, Top products and Customers summary (admin only)
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
          type="button"
        >
          <RefreshCw className="w-4 h-4 inline -mt-0.5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={loadAll}
            className="md:ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
            type="button"
          >
            Apply
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {loading ? (
          <>
            <div className="bg-white rounded-xl shadow border p-5 text-gray-500">Loading…</div>
            <div className="bg-white rounded-xl shadow border p-5 text-gray-500">Loading…</div>
            <div className="bg-white rounded-xl shadow border p-5 text-gray-500">Loading…</div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow border p-5">
              <div className="text-sm text-gray-500">Orders</div>
              <div className="text-3xl font-bold text-gray-900">{kpi?.orders_count ?? 0}</div>
            </div>

            <div className="bg-white rounded-xl shadow border p-5">
              <div className="text-sm text-gray-500">Items</div>
              <div className="text-3xl font-bold text-gray-900">{kpi?.items_count ?? 0}</div>
            </div>

            <div className="bg-white rounded-xl shadow border p-5">
              <div className="text-sm text-gray-500">Unique Customers</div>
              <div className="text-3xl font-bold text-gray-900">{kpi?.unique_customers ?? 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl shadow border overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-900">Top Products</div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading…</div>
        ) : topProducts.length === 0 ? (
          <div className="p-6 text-gray-500">No data.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white border-b">
              <tr>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-right">Total Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topProducts.map((r) => (
                <tr key={r.product_id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">{r.product_name}</td>
                  <td className="p-4 text-gray-700">{r.category || "—"}</td>
                  <td className="p-4 text-gray-700">{r.type || "—"}</td>
                  <td className="p-4 text-right font-bold text-gray-900">{r.total_qty ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customers */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-900">Customers</div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-gray-500">No data.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white border-b">
              <tr>
                <th className="p-4 text-left">Username</th>
                <th className="p-4 text-right">Orders</th>
                <th className="p-4 text-right">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((r) => (
                <tr key={r.customer_id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">{r.username}</td>
                  <td className="p-4 text-right font-bold text-gray-900">{r.orders_count ?? 0}</td>
                  <td className="p-4 text-right font-bold text-gray-900">{r.items_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
