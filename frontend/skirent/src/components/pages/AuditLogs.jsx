import { useEffect, useState } from "react";
import { getAuditLogs } from "../../api/auditLogsApi";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogs() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterAmount, setFilterAmount] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setRecords(data);
      } catch (err) {
        toast.error("Failed to load live reports");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredRecords = records.filter((record) => {
    if (filterAction !== "all" && record.action !== filterAction) return false;

    const qty = record.qty ?? 0;
    if (filterAmount === "1" && qty !== 1) return false;
    if (filterAmount === "2-5" && (qty < 2 || qty > 5)) return false;
    if (filterAmount === "6+" && qty < 6) return false;

    const pName = record.meta?.name || "";
    const uName = record.actorUserName || record.actorUserId || "";

    if (
      searchQuery &&
      !pName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !uName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // ✅ Export CSV with BOM (Hebrew/Excel friendly)
  const exportCSV = () => {
    if (!filteredRecords.length) {
      toast.info("No data to export");
      return;
    }

    const headers = ["User", "Product", "Action", "Qty", "Date"];

    const rows = filteredRecords.map((r) => [
      r.actorUserName || "",
      r.meta?.name || "",
      r.action || "",
      String(r.qty ?? ""),
      r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
    ]);

    const escapeCSV = (value) => {
      const s = String(value ?? "");
      return `"${s.replace(/"/g, '""')}"`;
    };

    // ✅ שימי לב: ; כדי שאקסל בעברית יפתח כטבלה יותר טוב
    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(";"))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  // ✅ Print / Save as PDF
  const exportPrintPDF = () => {
    if (!filteredRecords.length) {
      toast.info("No data to print");
      return;
    }

    const rowsHtml = filteredRecords
      .map((r) => {
        const user = r.actorUserName || "";
        const product = r.meta?.name || "";
        const action = r.action || "";
        const qty = r.qty ?? "";
        const date = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
        return `<tr>
          <td>${user}</td>
          <td>${product}</td>
          <td>${action}</td>
          <td>${qty}</td>
          <td>${date}</td>
        </tr>`;
      })
      .join("");

    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Inventory Reports</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { margin: 0 0 12px; }
          .sub { color: #555; margin: 0 0 18px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Inventory Reports</h1>
        <p class="sub">Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>User</th><th>Product</th><th>Action</th><th>Qty</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = () => window.print();
        </script>
      </body>
    </html>`;

    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Popup blocked. Allow popups to print/export.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  if (isLoading) {
    return <div className="p-10 text-center">Loading reports...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Inventory Reports</h2>
            <p className="text-gray-600">Real-time history from the database</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <Download size={18} />
              Export CSV
            </button>

            <button
              onClick={exportPrintPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg"
            >
              <Printer size={18} />
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Search product or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All Actions</option>
            <option value="RENT">Rental</option>
            <option value="TAKE">Take</option>
            <option value="RETURN_RENTED">Return</option>
            <option value="PRODUCT_CREATE">Create</option>
          </select>

          <select
            value={filterAmount}
            onChange={(e) => setFilterAmount(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All Quantities</option>
            <option value="1">1</option>
            <option value="2-5">2-5</option>
            <option value="6+">6+</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Qty</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.actorUserName}</td>
                  <td className="p-3">{r.meta?.name || "-"}</td>
                  <td className="p-3">{r.action}</td>
                  <td className="p-3">{r.qty}</td>
                  <td className="p-3">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
