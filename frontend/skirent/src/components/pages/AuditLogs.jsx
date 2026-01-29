import { useEffect, useState } from "react";
import { getAuditLogs } from "../../api/productsApi";
import { FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogs() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterAmount, setFilterAmount] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
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
    if (filterAmount !== "all") {
      const q = record.qty || record.quantity;
      if (filterAmount === "1" && q !== 1) return false;
      if (filterAmount === "2-5" && (q < 2 || q > 5)) return false;
      if (filterAmount === "6+") if (q < 6) return false;
    }
    const pName = record.product_name || record.productName || "";
    const uName = record.user_email || record.userName || "";
    if (searchQuery && !pName.toLowerCase().includes(searchQuery.toLowerCase()) && !uName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ✅ Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case "rental": return "bg-blue-50 text-blue-700 border-blue-100";
      case "take": return "bg-amber-50 text-amber-700 border-amber-100";
      case "return": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  // ✅ Bonus: Skeleton Loader Component
  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          {[...Array(5)].map((_, j) => (
            <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory Reports</h2>
            <p className="text-gray-500 mt-1">Monitor system activity and stock movements</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text" placeholder="Search product or user..."
              value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Actions</option>
              <option value="rental">Rental</option>
              <option value="take">Take</option>
              <option value="return">Return</option>
            </select>
            <select value={filterAmount} onChange={(e) => { setFilterAmount(e.target.value); setCurrentPage(1); }} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Quantities</option>
              <option value="1">1 Unit</option>
              <option value="2-5">2-5 Units</option>
              <option value="6+">6+ Units</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? <TableSkeleton /> : currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{record.user_email || "System"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{record.product_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-tight ${getActionColor(record.action)}`}>
                        {record.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-center">{record.qty || record.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right font-mono">{formatDateTime(record.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination UI */}
          {!isLoading && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}