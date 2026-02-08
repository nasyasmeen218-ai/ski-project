import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import api from "../../api/client";
import { getProducts } from "../../api/productsApi";
import { addToCart } from "../../api/cartApi";

import CustomerProductCard from "../layouts/layout/CustomerProductCard";

function showApiError(err, fallback = "Something went wrong") {
  if (!err?.response) return "Cannot reach server. Make sure backend is running (port 8000)";
  const status = err.response.status;
  const rawDetail = err?.response?.data?.detail ?? err?.response?.data?.message;
  const detail =
    typeof rawDetail === "string"
      ? rawDetail
      : Array.isArray(rawDetail)
      ? rawDetail.map((x) => x?.msg).join(", ")
      : fallback;

  if (status === 401) return "Unauthorized (please login again)";
  if (status === 403) return "Forbidden (role not allowed)";
  if (status === 409) return detail || "Not enough stock";
  if (status === 422) return detail || "Invalid request";
  if (status >= 500) return "Server error. Try again";
  return detail || fallback;
}

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();

      const mapped = (data || []).map((p) => ({
        ...p,
        price: Number(p.price ?? 0),
        image: p.imageurl ? `http://127.0.0.1:8000/${p.imageurl}` : null,
      }));

      setProducts(mapped);
    } catch (err) {
      toast.error(showApiError(err, "Failed to fetch products"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(showApiError(err, "Add to cart failed"));
    }
  };

  const handleRent = async (product, days = 2, qty = 1) => {
    try {
      await api.post(`/products/${product.id}/rent`, { qty, days });
      toast.success(`${product.name} rented for ${days} days`);
      await fetchMyProducts();
    } catch (err) {
      toast.error(showApiError(err, "Rental failed"));
    }
  };

  const safeProducts = useMemo(() => products || [], [products]);

  if (loading) return <div className="p-10 text-center">Loading your gear...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {safeProducts.map((product) => (
          <CustomerProductCard
            key={product.id}
            product={product}
            onBuy={() => handleAddToCart(product)}
            onRent={() => handleRent(product, 2, 1)}
            rentDisabled={Number(product.availableQuantity ?? 0) <= 0}
          />
        ))}
      </div>
    </div>
  );
}
