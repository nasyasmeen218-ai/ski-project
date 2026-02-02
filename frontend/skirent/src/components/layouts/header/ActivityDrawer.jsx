import { X, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAuditLogs } from "../../../api/auditLogsApi";

export default function ActivityDrawer({ onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getAuditLogs();
        setRecords((data || []).slice(0, 12)); // 12 אחרונים
      } catch (e) {
        toast.error("Failed to load recent activities");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getActionColor = (action) => {
    const a = (action || "").toUpperCase();
    if (a === "RENT") return "bg-blue-100 text-blue-700 border-blue-200";
    if (a === "TAKE") return "bg-orange-100 text-orange-700 border-orange-200";
    if (a.startsWith("RETURN")) return "bg-green-100 text-green-700 border-green-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const label = (action) => {
    const a = (action || "").toUpperCase();
    if (a === "RENT") return "Rental";
    if (a === "TAKE") return "Take";
    if (a.startsWith("RETURN")) return "Return";
    if (a === "PRODUCT_CREATE") return "Create";
    return a || "Action";
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Activities
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm">Activity history in the system</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading && <div className="text-center text-gray-500 py-10">Loading...</div>}

          {!loading &&
            records.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(r.action)}`}>
                    {label(r.action)}
                  </span>
                  <div className="text-right text-xs text-gray-500">
                    <div>{formatTime(r.createdAt)}</div>
                    <div>{formatDate(r.createdAt)}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">{r.meta?.name || "-"}</h4>
                  <p className="text-sm text-gray-600">
                    {r.actorUserName || r.actorUserId} • Qty: {r.qty ?? 0}
                  </p>
                  {r.meta?.days && (
                    <p className="text-sm text-blue-600">Duration: {r.meta.days} days</p>
                  )}
                </div>
              </div>
            ))}

          {!loading && records.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activities to display</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
