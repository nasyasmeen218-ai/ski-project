import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Package2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import ProductCard from "../layouts/layout/ProductCard";
import RentalDialog from "../layouts/layout/RentalDialog";

import {
  getProducts,
  takeProduct,
  returnTakenProduct,
  rentProduct,
  returnRentedProduct,
} from "../../api/productsApi";


function showApiError(err, fallback = "Something went wrong") {
  if (!err?.response) return "Cannot reach server. Make sure backend is running (port 8000)";
  const status = err.response.status;
  const detail = err?.response?.data?.detail ?? err?.response?.data?.message;
  if (status === 401) return "Unauthorized (please login again)";
  if (status === 403) return "Forbidden";
  if (status === 422) return "Invalid request (check qty/days)";
  if (status >= 500) return "Server error. Try again";
  return (typeof detail === "string" && detail) || fallback;
}

export default function EmployeeProducts({ onRental, onTake, onReturn }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [minQuantity, setMinQuantity] = useState(0);
  const [maxQuantity, setMaxQuantity] = useState(100);
  const [showFilter, setShowFilter] = useState(false);

  // ✅ הוספת Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  const [rentalProduct, setRentalProduct] = useState(null);

  const toastOpts = { position: "top-center" };

  const refreshProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await refreshProducts();
      } catch (e) {
        console.error(e);
        toast.error(showApiError(e, "Failed to load products"), toastOpts);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ✅ איפוס עמוד כשמשנים סינון
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedGender, selectedType, minQuantity, maxQuantity]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const pCat = (product.category || "").trim().toLowerCase();
      const pGender = (product.gender || "").trim().toLowerCase();
      const pName = (product.name || "").toLowerCase();

      if (searchQuery && !pName.includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (selectedCategory !== "all" && pCat !== selectedCategory.toLowerCase()) {
        return false;
      }

      if (
        selectedCategory === "clothing" &&
        selectedGender !== "all" &&
        pGender !== selectedGender.toLowerCase()
      ) {
        return false;
      }

      if (selectedType !== "all" && product.type !== selectedType) return false;

      const available = Number(product.availableQuantity ?? product.quantity ?? 0);
      if (available < minQuantity || available > maxQuantity) return false;

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

  // ✅ לוגיקת החיתוך לעמודים
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const getAvailableTypes = () => {
    if (selectedCategory === "all") return [];
    return Array.from(
      new Set(
        products
          .filter((p) => {
            const pCat = (p.category || "").trim().toLowerCase();
            const pGender = (p.gender || "").trim().toLowerCase();
            
            if (pCat !== selectedCategory.toLowerCase()) return false;
            if (
              selectedCategory === "clothing" &&
              selectedGender !== "all" &&
              pGender !== selectedGender.toLowerCase()
            ) {
              return false;
            }
            return true;
          })
          .map((p) => p.type)
          .filter((t) => !!t)
      )
    );
  };

  const handleRentalOpen = (product) => setRentalProduct(product);

  const handleRentalConfirm = async (days, qty) => {
    if (!rentalProduct) return;

    try {
      if (onRental) {
        await onRental(rentalProduct.id, days, qty);
      } else {
        await rentProduct(rentalProduct.id, days, qty);
        toast.success("Rented successfully", toastOpts);
      }

      setRentalProduct(null);
      await refreshProducts();
    } catch (e) {
      console.error(e);
      toast.error(showApiError(e, "Rent failed"), toastOpts);
    }
  };

  const handleTake = async (productId) => {
    try {
      if (onTake) {
        await onTake(productId, 1);
      } else {
        await takeProduct(productId, 1);
        toast.success("Taken successfully", toastOpts);
      }
      await refreshProducts();
    } catch (e) {
      console.error(e);
      toast.error(showApiError(e, "Take failed"), toastOpts);
    }
  };

  const handleUniversalReturn = async (product) => {
    try {
      if (Number(product.rentedQuantity) > 0) {
        await returnRentedProduct(product.id, 1);
        toast.success("Rental returned successfully", toastOpts);
      } 
      else {
        if (onReturn) {
          await onReturn(product.id, 1);
        } else {
          await returnTakenProduct(product.id, 1);
          toast.success("Returned to stock successfully", toastOpts);
        }
      }
      await refreshProducts();
    } catch (e) {
      console.error(e);
      toast.error(showApiError(e, "Return failed"), toastOpts);
    }
  };

  const handleReturnRented = async (productId) => {
    try {
      await returnRentedProduct(productId, 1);
      toast.success("Rental returned successfully", toastOpts);
      await refreshProducts();
    } catch (e) {
      console.error(e);
      toast.error(showApiError(e, "Return rented failed"), toastOpts);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
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

      <div 
        className="relative bg-cover bg-center py-16 border-b" 
        style={{ backgroundImage: "url('/src/assets/ski-mountains.png')" }}
      >
        <div className="absolute inset-0 bg-white/40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Products</h2>
            <p className="text-gray-700 text-lg font-medium">Browse and manage inventory</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`px-4 py-3 border rounded-lg transition-all bg-white shadow-sm ${
                showFilter
                  ? "border-blue-600 text-blue-600"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
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
                className="w-full h-12 px-4 py-3 pl-12 border border-transparent rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  Min Available Quantity
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
                  Max Available Quantity
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
          <div className="text-gray-500 py-10 text-center font-bold">Loading products...</div>
        ) : paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="employee"
                  onRental={() => handleRentalOpen(product)}
                  onTake={() => handleTake(product.id)}
                  onReturn={() => handleUniversalReturn(product)}
                  onReturnRented={() => handleReturnRented(product.id)}
                />
              ))}
            </div>

            {/* ✅ הוספת כפתורי דפדוף (Pagination UI) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pb-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === i + 1 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-white text-gray-600 hover:bg-gray-50 border"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
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

      {rentalProduct && (
        <RentalDialog
          product={rentalProduct}
          onConfirm={handleRentalConfirm}
          onClose={() => setRentalProduct(null)}
        />
      )}
    </div>
  );
}