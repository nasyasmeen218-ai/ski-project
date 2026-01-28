import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export default function ProductFormDialog({ mode, product, onConfirm, onClose }) {
  const isAdd = mode === "add";

  const clothingTypes = useMemo(
    () => ["Jackets", "Second Layer", "Thermal Wear", "Pants"],
    []
  );
  const equipmentTypes = useMemo(
    () => ["Skis", "Goggles", "Helmets", "Gloves", "Socks", "Boots"],
    []
  );

  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "clothing",
    gender: product?.gender || "male",
    type: product?.type || "",
    quantity: Number(product?.quantity ?? 0),
    availableQuantity: Number(product?.availableQuantity ?? 0),
    rentedQuantity: Number(product?.rentedQuantity ?? 0),
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setFormData({
      name: product?.name || "",
      category: product?.category || "clothing",
      gender: product?.gender || "male",
      type: product?.type || "",
      quantity: Number(product?.quantity ?? 0),
      availableQuantity: Number(product?.availableQuantity ?? 0),
      rentedQuantity: Number(product?.rentedQuantity ?? 0),
    });
    setError("");
  }, [product, mode]);

  useEffect(() => {
    if (!isAdd) return;

    setFormData((prev) => {
      const q = Number(prev.quantity || 0);
      return {
        ...prev,
        availableQuantity: q,
        rentedQuantity: 0,
      };
    });
  }, [isAdd, formData.quantity]);

  const types = formData.category === "clothing" ? clothingTypes : equipmentTypes;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");

    if (name === "quantity" || name === "availableQuantity" || name === "rentedQuantity") {
      const num = Number(value);

      setFormData((prev) => {
        if (name === "quantity") {
          const q = Math.max(0, num);

          if (isAdd) {
            return {
              ...prev,
              quantity: q,
              availableQuantity: q,
              rentedQuantity: 0,
            };
          }

          let a = clamp(Number(prev.availableQuantity || 0), 0, q);
          let r = clamp(Number(prev.rentedQuantity || 0), 0, q);

          if (a + r > q) {
            const overflow = a + r - q;
            a = Math.max(0, a - overflow);
          }

          return { ...prev, quantity: q, availableQuantity: a, rentedQuantity: r };
        }

        if (isAdd) return prev;

        const q = Number(prev.quantity || 0);

        if (name === "availableQuantity") {
          let a = clamp(num, 0, q);
          let r = clamp(Number(prev.rentedQuantity || 0), 0, q);

          if (a + r > q) {
            r = Math.max(0, q - a);
          }

          return { ...prev, availableQuantity: a, rentedQuantity: r };
        }

        if (name === "rentedQuantity") {
          let r = clamp(num, 0, q);
          let a = clamp(Number(prev.availableQuantity || 0), 0, q);

          if (a + r > q) {
            a = Math.max(0, q - r);
          }

          return { ...prev, availableQuantity: a, rentedQuantity: r };
        }

        return prev;
      });

      return;
    }

    setFormData((prev) => {
      if (name === "category") {
        const nextCategory = value;
        return {
          ...prev,
          category: nextCategory,
          type: "",
          gender: nextCategory === "clothing" ? prev.gender || "male" : prev.gender,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const validate = () => {
    if (!formData.name.trim()) return "Product name is required";
    if (!formData.type) return "Please select a product type";
    if (Number.isNaN(formData.quantity) || formData.quantity < 0) return "Quantity must be 0 or more";

    if (!isAdd) {
      const q = Number(formData.quantity || 0);
      const a = Number(formData.availableQuantity || 0);
      const r = Number(formData.rentedQuantity || 0);

      if (a < 0 || r < 0) return "Values must be 0 or more";
      if (a > q || r > q) return "Available/Rented cannot exceed Total";
      if (a + r !== q) return "Total must equal Available + Rented";
    }

    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const productData = {
      name: formData.name.trim(),
      category: formData.category,
      ...(formData.category === "clothing" ? { gender: formData.gender } : {}),
      type: formData.type,
      quantity: Number(formData.quantity || 0),
      availableQuantity: isAdd ? Number(formData.quantity || 0) : Number(formData.availableQuantity || 0),
      rentedQuantity: isAdd ? 0 : Number(formData.rentedQuantity || 0),
    };

    onConfirm(productData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ✅ smaller + scroll inside */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        {/* ✅ sticky header so X always visible */}
        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdd ? "Add new product" : "Edit product"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isAdd ? "Create a new product in the inventory" : "Update product details and quantities"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-50 inline-flex items-center justify-center"
            type="button"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Ski Jacket"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="clothing">Clothing</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            {formData.category === "clothing" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-rose-600">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-rose-600">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">Select Type</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Quantity <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {!isAdd && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available</label>
                  <input
                    type="number"
                    name="availableQuantity"
                    value={formData.availableQuantity}
                    onChange={handleChange}
                    min="0"
                    max={formData.quantity}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rented</label>
                  <input
                    type="number"
                    name="rentedQuantity"
                    value={formData.rentedQuantity}
                    onChange={handleChange}
                    min="0"
                    max={formData.quantity}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {isAdd && (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              In <span className="font-medium">Add</span> mode,{" "}
              <span className="font-medium">Available</span> will automatically equal{" "}
              <span className="font-medium">Total</span>, and{" "}
              <span className="font-medium">Rented</span> will be{" "}
              <span className="font-medium">0</span>.
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
            >
              {isAdd ? "Add Product" : "Save Changes"}
            </button>
          </div>

          {/* small spacer so last button isn't glued to bottom */}
          <div className="h-2" />
        </form>
      </div>
    </div>
  );
}
