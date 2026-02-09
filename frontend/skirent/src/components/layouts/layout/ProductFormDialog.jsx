import { useEffect, useMemo, useState } from "react";
import { X, Package, Tag, Users, Hash, Info, ImageIcon } from "lucide-react";

export default function ProductFormDialog({
  mode,
  product,
  onConfirm = () => {},
  onClose = () => {},
}) {
  const isAdd = mode === "add";
  const isView = mode === "view";

  const clothingTypes = useMemo(
    () => ["Jackets", "Second Layer", "Thermal Wear", "Pants"],
    []
  );
  const equipmentTypes = useMemo(
    () => ["Skis", "Goggles", "Helmets", "Gloves", "Socks", "Boots", "Snowboard"],
    []
  );

  const categoryOptions = useMemo(
    () => [
      { value: "clothing", label: "Clothing" },
      { value: "equipment", label: "Equipment" },
      { value: "__other__", label: "Other / New category" },
    ],
    []
  );

  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "clothing",
    gender: product?.gender || "male",
    type: product?.type || "",
    price: Number(product?.price ?? 0), // ✅ הוספה
    quantity: Number(product?.quantity ?? 0),
    availableQuantity: Number(product?.availableQuantity ?? 0),
    rentedQuantity: Number(product?.rentedQuantity ?? 0),
    imageurl: product?.imageurl || "",
  });

  const [customCategory, setCustomCategory] = useState("");
  const [customType, setCustomType] = useState("");
  const [typeMode, setTypeMode] = useState("select"); // "select" | "custom"
  const [error, setError] = useState("");

  // helpers
  const isKnownCategory = (c) => c === "clothing" || c === "equipment";
  const typesForCategory = (cat) => (cat === "clothing" ? clothingTypes : equipmentTypes);

  useEffect(() => {
    const initialCategory = product?.category || "clothing";
    const known = isKnownCategory(initialCategory);

    const initialType = product?.type || "";
    const knownType = known ? typesForCategory(initialCategory).includes(initialType) : false;

    setFormData({
      name: product?.name || "",
      category: known ? initialCategory : "__other__",
      gender: product?.gender || "male",
      type: knownType ? initialType : "",
      price: Number(product?.price ?? 0), // ✅ הוספה
      quantity: Number(product?.quantity ?? 0),
      availableQuantity: Number(product?.availableQuantity ?? 0),
      rentedQuantity: Number(product?.rentedQuantity ?? 0),
      imageurl: product?.imageurl || "",
    });

    setCustomCategory(known ? "" : initialCategory);
    setTypeMode(knownType ? "select" : (initialType ? "custom" : "select"));
    setCustomType(knownType ? "" : initialType);
    setError("");
  }, [product, mode, clothingTypes, equipmentTypes]);

  // Add mode: available = quantity, rented = 0
  useEffect(() => {
    if (!isAdd) return;
    setFormData((prev) => {
      const q = Number(prev.quantity || 0);
      return { ...prev, availableQuantity: q, rentedQuantity: 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdd, formData.quantity]);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");

    // numeric fields
    if (
      name === "quantity" ||
      name === "availableQuantity" ||
      name === "rentedQuantity" ||
      name === "price"
    ) {
      const num = Number(value);

      if (name === "price") {
        setFormData((prev) => ({ ...prev, price: Math.max(0, num) }));
        return;
      }

      setFormData((prev) => {
        if (name === "quantity") {
          const q = Math.max(0, num);

          if (isAdd) {
            return { ...prev, quantity: q, availableQuantity: q, rentedQuantity: 0 };
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
          if (a + r > q) r = Math.max(0, q - a);
          return { ...prev, availableQuantity: a, rentedQuantity: r };
        }

        if (name === "rentedQuantity") {
          let r = clamp(num, 0, q);
          let a = clamp(Number(prev.availableQuantity || 0), 0, q);
          if (a + r > q) a = Math.max(0, q - r);
          return { ...prev, availableQuantity: a, rentedQuantity: r };
        }

        return prev;
      });

      return;
    }

    // category switch
    if (name === "category") {
      setFormData((prev) => {
        if (value === "__other__") {
          setCustomCategory("");
          setTypeMode("custom");
          setCustomType(prev.type || "");
          return { ...prev, category: "__other__", type: "" };
        }

        setCustomCategory("");
        setTypeMode("select");
        setCustomType("");

        return {
          ...prev,
          category: value,
          type: "",
          gender: value === "clothing" ? prev.gender || "male" : prev.gender,
        };
      });

      return;
    }

    // type select handler
    if (name === "type") {
      if (value === "__other_type__") {
        setTypeMode("custom");
        setFormData((prev) => ({ ...prev, type: "" }));
        return;
      }
      setTypeMode("select");
      setCustomType("");
      setFormData((prev) => ({ ...prev, type: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) return "Product name is required";

    const finalCategory =
      formData.category === "__other__" ? customCategory.trim() : formData.category;
    if (!finalCategory) return "Category is required";

    const finalType = typeMode === "custom" ? customType.trim() : formData.type;
    if (!finalType) return "Please select / enter a product type";

    const price = Number(formData.price);
    if (Number.isNaN(price) || price < 0) return "Price must be 0 or more";

    if (Number.isNaN(formData.quantity) || formData.quantity < 0) {
      return "Quantity must be 0 or more";
    }

    // in edit mode, enforce a+r=q
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

    const finalCategory =
      formData.category === "__other__" ? customCategory.trim() : formData.category;
    const finalType = typeMode === "custom" ? customType.trim() : formData.type;

    const productData = {
      name: formData.name.trim(),
      category: finalCategory,
      ...(finalCategory === "clothing" ? { gender: formData.gender } : {}),
      type: finalType,
      price: Number(formData.price || 0), // ✅ חובה
      quantity: Number(formData.quantity || 0),
      availableQuantity: isAdd
        ? Number(formData.quantity || 0)
        : Number(formData.availableQuantity || 0),
      rentedQuantity: isAdd ? 0 : Number(formData.rentedQuantity || 0),
      imageurl: formData.imageurl || "",
    };

    onConfirm(productData);
  };

  // --- VIEW MODE UI ---
  if (isView) {
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-xs">
              <Info className="w-4 h-4" />
              Product Details
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                {formData.imageurl ? (
                  <img src={formData.imageurl} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{formData.name}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                  {formData.category === "__other__" ? (customCategory || "other") : formData.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center">
                <span className="block text-[10px] uppercase font-bold text-blue-400 mb-1">Available</span>
                <span className="text-2xl font-black text-blue-700">{formData.availableQuantity}</span>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 text-center">
                <span className="block text-[10px] uppercase font-bold text-orange-400 mb-1">Rented</span>
                <span className="text-2xl font-black text-orange-700">{formData.rentedQuantity}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                <div className="flex items-center gap-2 text-gray-500"><Tag className="w-4 h-4" /> Type</div>
                <div className="font-semibold text-gray-900">
                  {typeMode === "custom" ? customType : formData.type}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                <div className="flex items-center gap-2 text-gray-500"><Users className="w-4 h-4" /> Gender</div>
                <div className="font-semibold text-gray-900 capitalize">{formData.gender || "N/A"}</div>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                <div className="flex items-center gap-2 text-gray-500"><Hash className="w-4 h-4" /> Total Stock</div>
                <div className="font-semibold text-gray-900">{formData.quantity} Units</div>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                <div className="flex items-center gap-2 text-gray-500"><Hash className="w-4 h-4" /> Price</div>
                <div className="font-semibold text-gray-900">{Number(formData.price || 0)} ₪</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 flex justify-end">
            <button onClick={onClose} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ADD/EDIT MODE UI ---
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-100">
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
            className="w-10 h-10 rounded-xl hover:bg-gray-50 inline-flex items-center justify-center transition"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Image URL
            </label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="imageurl"
                  value={formData.imageurl}
                  onChange={handleChange}
                  placeholder="https://link-to-image.com/img.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                />
                <ImageIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              <div className="w-12 h-12 rounded-xl border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.imageurl ? (
                  <img src={formData.imageurl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-300" />
                )}
              </div>
            </div>
          </div>

          {/* Name */}
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

          {/* Category + Gender */}
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
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {formData.category === "__other__" && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setError("");
                  }}
                  placeholder="Type a new category..."
                  className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
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

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-rose-600">*</span>
            </label>

            {typeMode === "custom" ? (
              <>
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => {
                    setCustomType(e.target.value);
                    setError("");
                  }}
                  placeholder="Type a new product type..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setTypeMode("select");
                    setCustomType("");
                    setFormData((prev) => ({ ...prev, type: "" }));
                  }}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Back to list
                </button>
              </>
            ) : (
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Select Type</option>
                {typesForCategory(formData.category === "__other__" ? "equipment" : formData.category).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__other_type__">Other / New type</option>
              </select>
            )}
          </div>

          {/* ✅ Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Quantities */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rented
                  </label>
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
              className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow-md"
            >
              {isAdd ? "Add Product" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

