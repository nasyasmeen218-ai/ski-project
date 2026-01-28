import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Package2 } from "lucide-react";
import ProductCard from "../layouts/layout/ProductCard";
import ProductFormDialog from "../layouts/layout/ProductFormDialog";

export default function AdminProducts({
  products = [], // ✅ prevents crash when products is undefined
  onDelete,
  onAddProduct,
  onEditProduct,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [minQuantity, setMinQuantity] = useState(0);
  const [maxQuantity, setMaxQuantity] = useState(100);
  const [showFilter, setShowFilter] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  // keep viewing product in sync with latest products list
  useEffect(() => {
    if (!viewingProduct) return;
    const latest = products.find((p) => p.id === viewingProduct.id);
    if (!latest) setViewingProduct(null);
    else setViewingProduct(latest);
  }, [products, viewingProduct]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      if (selectedCategory !== "all" && product.category !== selectedCategory)
        return false;

      if (
        selectedCategory === "clothing" &&
        selectedGender !== "all" &&
        product.gender !== selectedGender
      )
        return false;

      if (selectedType !== "all" && product.type !== selectedType) return false;

      if (product.quantity < minQuantity || product.quantity > maxQuantity)
        return false;

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedGender,
    selectedType,
    minQuantity,
    maxQuantity,
  ]);

  const getAvailableTypes = () => {
    if (selectedCategory === "all") return [];
    return Array.from(
      new Set(
        products
          .filter((p) => {
            if (p.category !== selectedCategory) return false;
            if (
              selectedCategory === "clothing" &&
              selectedGender !== "all" &&
              p.gender !== selectedGender
            )
              return false;
            return true;
          })
          .map((p) => p.type)
          .filter((t) => !!t)
      )
    );
  };

  const handleEditSubmit = (productData) => {
    if (!editingProduct) return;
    onEditProduct?.(editingProduct.id, productData);
    setEditingProduct(null);
  };

  return (
    <div>
      {/* Category header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedGender("all");
                setSelectedType("all");
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              type="button"
            >
              All
            </button>

            <button
              onClick={() => {
                setSelectedCategory("clothing");
                setSelectedGender("all");
                setSelectedType("all");
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === "clothing"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              type="button"
            >
              Clothing
            </button>

            <button
              onClick={() => {
                setSelectedCategory("equipment");
                setSelectedGender("all");
                setSelectedType("all");
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === "equipment"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              type="button"
            >
              Equipment
            </button>
          </div>

          {selectedCategory === "clothing" && (
            <div className="flex items-center gap-3 pb-4">
              <button
                onClick={() => setSelectedGender("all")}
                className={`px-4 py-1 rounded-full text-sm transition-all ${
                  selectedGender === "all"
                    ? "bg-gray-800 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                type="button"
              >
                All
              </button>
              <button
                onClick={() => setSelectedGender("male")}
                className={`px-4 py-1 rounded-full text-sm transition-all ${
                  selectedGender === "male"
                    ? "bg-gray-800 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                type="button"
              >
                Men
              </button>
              <button
                onClick={() => setSelectedGender("female")}
                className={`px-4 py-1 rounded-full text-sm transition-all ${
                  selectedGender === "female"
                    ? "bg-gray-800 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                type="button"
              >
                Women
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Product Management
          </h2>
          <p className="text-gray-600">Manage all products in the system</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`px-4 py-3 border rounded-lg transition-all ${
              showFilter
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
            type="button"
            aria-label="Toggle filters"
            title="Filters"
          >
            <Filter className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {showFilter && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedCategory !== "all" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {getAvailableTypes().map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Total Quantity
                </label>
                <input
                  type="number"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Total Quantity
                </label>
                <input
                  type="number"
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="admin"
                onEdit={() => setEditingProduct(product)}
                onDelete={() => onDelete?.(product.id)}
                onView={() => setViewingProduct(product)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {editingProduct && (
        <ProductFormDialog
          mode="edit"
          product={editingProduct}
          onConfirm={handleEditSubmit}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="bg-blue-600 p-6 text-white rounded-t-lg">
              <h2 className="text-xl font-bold">Product Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Product Name</p>
                <p className="font-medium text-gray-900">
                  {viewingProduct.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="font-medium text-gray-900">
                  {viewingProduct.category === "clothing"
                    ? "Clothing"
                    : "Equipment"}
                </p>
              </div>

              {viewingProduct.gender && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gender</p>
                  <p className="font-medium text-gray-900">
                    {viewingProduct.gender === "male" ? "Men" : "Women"}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-medium text-gray-900">{viewingProduct.type}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {viewingProduct.availableQuantity}
                  </p>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {viewingProduct.rentedQuantity}
                  </p>
                  <p className="text-xs text-gray-600">Rented</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {viewingProduct.quantity}
                  </p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>

              <button
                onClick={() => setViewingProduct(null)}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all mt-6 font-medium"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
