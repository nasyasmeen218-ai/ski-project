import { useState } from "react";
import { mockRentalRecords } from "../../types/types.js";
import { FileText, Download } from "lucide-react";

export default function AuditLogs() {
  const [records] = useState(mockRentalRecords);
  const [filterAction, setFilterAction] = useState("all");
  const [filterAmount, setFilterAmount] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = records.filter((record) => {
    if (filterAction !== "all" && record.action !== filterAction) return false;

    if (filterAmount !== "all") {
      if (filterAmount === "1" && record.quantity !== 1) return false;
      if (filterAmount === "2-5" && (record.quantity < 2 || record.quantity > 5)) return false;
      if (filterAmount === "6+" && record.quantity < 6) return false;
    }

    if (
      searchQuery &&
      !record.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.userName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Inventory Reports</h2>
            <p className="text-gray-600">Complete history of all actions in the system</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm">
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by product or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Actions</option>
                <option value="rental">Rental</option>
                <option value="take">Take</option>
                <option value="return">Return</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Quantity</label>
              <select
                value={filterAmount}
                onChange={(e) => setFilterAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Quantities</option>
                <option value="1">1</option>
                <option value="2-5">2-5</option>
                <option value="6+">6+</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">User Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Product Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Action Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{record.userName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.productName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(record.action)}`}>
                        {getActionLabel(record.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.rentalDays ? `${record.rentalDays} days` : "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(record.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
