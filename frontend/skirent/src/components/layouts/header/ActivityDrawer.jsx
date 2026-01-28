import { X, Clock } from "lucide-react";
import { mockRentalRecords } from "../../../types/types";
import { useState } from "react";

export default function ActivityDrawer({ onClose }) {
  const [records] = useState(mockRentalRecords);

  const getActionColor = (action) => {
    switch (action) {
      case "rental":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "take":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "return":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case "rental":
        return "Rental";
      case "take":
        return "Take";
      case "return":
        return "Return";
      default:
        return action;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
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
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(
                    record.action
                  )}`}
                >
                  {getActionLabel(record.action)}
                </span>
                <div className="text-right text-xs text-gray-500">
                  <div>{formatTime(record.timestamp)}</div>
                  <div>{formatDate(record.timestamp)}</div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-medium text-gray-900">{record.productName}</h4>
                <p className="text-sm text-gray-600">
                  {record.userName} • Qty: {record.quantity}
                </p>
                {record.rentalDays && (
                  <p className="text-sm text-blue-600">
                    Duration: {record.rentalDays} days
                  </p>
                )}
                {record.endDate && (
                  <p className="text-xs text-gray-500">Until: {formatDate(record.endDate)}</p>
                )}
              </div>
            </div>
          ))}

          {records.length === 0 && (
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
