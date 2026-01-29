import { useEffect, useState } from "react";
import { getAuditLogs } from "../../api/productsApi"; // חיבור לפונקציה שיצרנו ב-API
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogs() {
  // שינוי 1: המידע מגיע מה-API ולא מ-mock
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterAmount, setFilterAmount] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // שינוי 2: useEffect שמושך את הנתונים ברגע שהדף עולה
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
    // התאמה לשמות השדות מהבאקנד (action, qty, product_name)
    if (filterAction !== "all" && record.action !== filterAction) return false;

    if (filterAmount !== "all") {
      const q = record.qty || record.quantity;
      if (filterAmount === "1" && q !== 1) return false;
      if (filterAmount === "2-5" && (q < 2 || q > 5)) return false;
      if (filterAmount === "6+" && q < 6) return false;
    }

    const pName = record.product_name || record.productName || "";
    const uName = record.user_email || record.userName || "";

    if (
      searchQuery &&
      !pName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !uName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case "rental": return "bg-blue-100 text-blue-700 border-blue-200";
      case "take": return "bg-orange-100 text-orange-700 border-orange-200";
      case "return": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (isLoading) return <div className="p-10 text-center">Loading reports...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Inventory Reports</h2>
            <p className="text-gray-600">Real-time history from the database</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters Section - נשאר זהה לעיצוב שלך */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search product or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="border p-2 rounded-lg">
              <option value="all">All Actions</option>
              <option value="rental">Rental</option>
              <option value="take">Take</option>
              <option value="return">Return</option>
            </select>
            <select value={filterAmount} onChange={(e) => setFilterAmount(e.target.value)} className="border p-2 rounded-lg">
              <option value="all">All Quantities</option>
              <option value="1">1</option>
              <option value="2-5">2-5</option>
              <option value="6+">6+</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Qty</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{record.user_email || "System"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.product_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(record.action)}`}>
                        {record.action?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.qty || record.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(record.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}