import { useState } from "react";
import { X, Calendar } from "lucide-react";

export default function RentalDialog({ product, onConfirm, onClose }) {
  const [rentalDays, setRentalDays] = useState(1);
  const [qty, setQty] = useState(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const calculateEndDate = () => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + rentalDays);
    return end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleConfirm = () => {
    if (rentalDays < 1) return;
    if (qty < 1) return;
    onConfirm?.(rentalDays, qty);
  };

  const maxQty = Number(product?.availableQuantity ?? 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="bg-blue-600 p-6 text-white rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Rent Product</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white" type="button">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm">{product?.name}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Product</div>
                <div className="font-medium text-gray-900">{product?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Available</div>
                <div className="text-2xl font-bold text-blue-600">
                  {product?.availableQuantity ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                value={rentalDays}
                onChange={(e) => setRentalDays(Number(e.target.value))}
                min="1"
                max="30"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                min="1"
                max={maxQty > 0 ? maxQty : 1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Estimated Return Date:</div>
              <div className="font-bold text-blue-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {calculateEndDate()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
              type="button"
              disabled={maxQty <= 0}
              title={maxQty <= 0 ? "No available quantity" : "Confirm Rental"}
            >
              Confirm Rental
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
