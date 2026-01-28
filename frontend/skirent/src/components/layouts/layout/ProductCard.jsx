import { useState } from "react";
import {
  Package,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Eye,
  ArrowDownUp,
  X,
} from "lucide-react";

export default function ProductCard({
  product,
  viewMode,
  onRental,
  onTake,
  onReturn,
  onEdit,
  onDelete,
  onView,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getCategoryLabel = () => {
    if (product.category === "clothing") {
      const genderLabel = product.gender === "male" ? "Men" : "Women";
      return `${genderLabel} • ${product.type}`;
    }
    return `${product.type}`;
  };

  const getCategoryBadge = () => {
    if (product.category === "clothing") {
      return {
        text: "Clothing",
        cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    }
    return {
      text: "Equipment",
      cls: "bg-slate-50 text-slate-700 border-slate-200",
    };
  };

  const getStockStatus = () => {
    const total = Number(product.quantity || 0);
    const available = Number(product.availableQuantity || 0);
    const percentage = total === 0 ? 0 : (available / total) * 100;

    if (percentage > 50)
      return {
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "In Stock",
      };
    if (percentage > 20)
      return {
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        text: "Low Stock",
      };
    return {
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      text: "Out of Stock",
    };
  };

  const categoryBadge = getCategoryBadge();
  const stockStatus = getStockStatus();

  const available = Number(product.availableQuantity || 0);
  const rented = Number(product.rentedQuantity || 0);
  const total = Number(product.quantity || 0);

  const handleConfirmDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* CARD - make equal height */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {product.name}
                </h3>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${categoryBadge.cls}`}
                  >
                    {categoryBadge.text}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${stockStatus.cls}`}
                  >
                    {stockStatus.text}
                  </span>
                </div>
              </div>
            </div>

            {viewMode === "admin" && (
              <button
                onClick={onView}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                type="button"
                title="View"
                aria-label="View"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="mt-3 text-sm text-gray-600">
            {product.category === "clothing" ? "Clothing" : "Equipment"} •{" "}
            {getCategoryLabel()}
          </p>
        </div>

        {/* Body grows, Actions stick to bottom */}
        <div className="px-5 pt-4 flex-1 flex flex-col">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Available" value={available} color="text-blue-600" />
            <Stat label="Rented" value={rented} color="text-orange-600" />
            <Stat label="Total" value={total} color="text-gray-900" />
          </div>

          {/* Reserve space so all cards align */}
          <div className="mt-3 min-h-[24px]">
            {rented > 0 ? (
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <Clock className="w-4 h-4" />
                <span>{rented} currently rented</span>
              </div>
            ) : null}
          </div>

          {/* Actions pinned to bottom */}
          <div className="mt-auto pb-5 pt-4">
            {viewMode === "employee" && (
              <div className="grid grid-cols-3 gap-2">
                <ActionBtn
                  onClick={onReturn}
                  disabled={rented === 0}
                  color="emerald"
                >
                  Return
                </ActionBtn>

                <ActionBtn
                  onClick={onTake}
                  disabled={available === 0}
                  color="dark"
                >
                  <ArrowDownUp className="w-4 h-4" />
                  Take
                </ActionBtn>

                <ActionBtn
                  onClick={onRental}
                  disabled={available === 0}
                  color="blue"
                >
                  <Calendar className="w-4 h-4" />
                  Rent
                </ActionBtn>
              </div>
            )}

            {viewMode === "admin" && (
              <div className="grid grid-cols-2 gap-2">
                <ActionBtn onClick={onEdit} color="dark">
                  <Edit className="w-4 h-4" />
                  Edit
                </ActionBtn>

                <ActionBtn
                  onClick={() => setShowDeleteConfirm(true)}
                  color="red"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </ActionBtn>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Delete product
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-9 h-9 rounded-xl hover:bg-gray-50 inline-flex items-center justify-center"
                type="button"
                aria-label="Close"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {product.name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 h-10 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ActionBtn({ children, onClick, disabled, color }) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    red: "bg-rose-600 hover:bg-rose-700",
    dark: "bg-gray-900 hover:bg-black",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-10 rounded-xl text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]}`}
      type="button"
    >
      {children}
    </button>
  );
}
