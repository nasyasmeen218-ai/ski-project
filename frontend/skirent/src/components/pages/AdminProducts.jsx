import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Package2, Snowflake } from "lucide-react";
import { toast } from "sonner";

import ProductCard from "../layouts/layout/ProductCard";
import ProductFormDialog from "../layouts/layout/ProductFormDialog";

import {
  getProducts,
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  updateProduct as apiUpdateProduct,
} from "../../api/productsApi";

import mountainsBg from "../../assets/ski-mountains.png";

export default function AdminProducts({ addSignal = 0 }) {
  // --- STATES המקוריים ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [minQuantity, setMinQuantity] = useState(0);
  const [maxQuantity, setMaxQuantity] = useState(100);
  const [showFilter, setShowFilter] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [adding, setAdding] = useState(false);

  const toastOpts = { position: "top-center" };

  // --- REFRESH FUNCTION ---
  const refreshProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  // --- USE EFFECTS המקוריים ---
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await refreshProducts();
      } catch (e) {
        console.error(e);
        toast.error("Failed to load products (check login/token)", toastOpts);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // open Add dialog when Navbar triggers it
  useEffect(() => {
    if (addSignal > 0) setAdding(true);
  }, [addSignal]);

  useEffect(() => {
    if (!viewingProduct) return;
    const latest = products.find((p) => p.id === viewingProduct.id);
    if (!latest) setViewingProduct(null);
    else setViewingProduct(latest);
  }, [products, viewingProduct]);

  // --- FILTERED PRODUCTS LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;

      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;

      if (
        selectedCategory === "clothing" &&
        selectedGender !== "all" &&
        product.gender !== selectedGender
      )
        return false;

      if (selectedType !== "all" && product.type !== selectedType) return false;

      if (product.quantity < minQuantity || product.quantity > maxQuantity) return false;

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

  // --- GET AVAILABLE TYPES FUNCTION ---
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

  // --- HANDLERS (DELETE, EDIT, ADD) ---
  const handleDelete = async (productId) => {
    try {
      await apiDeleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted", toastOpts);
    } catch (e) {
      console.error(e);
      toast.error("Delete failed", toastOpts);
    }
  };

  const handleEditSubmit = async (productData) => {
    if (!editingProduct) return;
    try {
      const updated = await apiUpdateProduct(editingProduct.id, productData);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Product updated", toastOpts);
      setEditingProduct(null);
    } catch (e) {
      console.error(e);
      toast.error("Edit failed", toastOpts);
    }
  };

  const handleAddSubmit = async (productData) => {
    try {
      await apiCreateProduct(productData);
      toast.success("Product added", toastOpts);
      setAdding(false);
      await refreshProducts();
    } catch (e) {
      console.error(e);
      toast.error("Add failed", toastOpts);
    }
  };

  // --- RENDER ---
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 1. התפריט העליון (Category Header) - נשאר לבן ונקי כדי לא להסתיר את ה-Logout */}
      <div className="bg-white border-b border-gray-200 relative z-10">
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
                  ? "bg-blue-600 text-white shadow-md"
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
                  ? "bg-blue-600 text-white shadow-md"
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
                  ? "bg-blue-600 text-white shadow-md"
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

      {/* 2. אזור התוכן - הרקע מתחיל כאן */}
      <div className="relative flex-grow">
        {/* תמונת רקע קבועה שמתחילה מתחת לטאבים */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{ 
            backgroundImage: `url(${mountainsBg})`,
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed'
          }}
        ></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">Product Management</h2>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 text-xs font-bold animate-pulse">
                  <Snowflake className="w-4 h-4" />
                  <span>-4°C SKI RESORT</span>
                </div>
              </div>
              <p className="text-gray-600">Manage all products in the system</p>
            </div>
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
            >
              <Filter className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {showFilter && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4 tracking-wide uppercase text-sm">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedCategory !== "all" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-gray-500 text-center py-20 font-medium">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="admin"
                  onEdit={() => setEditingProduct(product)}
                  onDelete={() => handleDelete(product.id)}
                  onView={() => setViewingProduct(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
              <Package2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Dialogs --- */}
      {adding && (
        <ProductFormDialog
          mode="add"
          onConfirm={handleAddSubmit}
          onClose={() => setAdding(false)}
        />
      )}

      {editingProduct && (
        <ProductFormDialog
          mode="edit"
          product={editingProduct}
          onConfirm={handleEditSubmit}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}