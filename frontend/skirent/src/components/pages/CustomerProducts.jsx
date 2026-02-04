import { useState, useEffect } from "react";
// אני משתמש כאן ב-API הקיים שלך שמושך מה-DB
import { getProducts } from "../../api/productsApi"; 
import CustomerProductCard from "../layouts/layout/CustomerProductCard";
import { toast } from "sonner";

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      // כאן הבקשה הולכת ל-DB שלך (GET /products)
      const data = await getProducts(); 
      setProducts(data);
    } catch (err) {
      toast.error("Failed to fetch products from database");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, qty: 1 })
      });

      if (!response.ok) throw new Error();
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error("Out of stock or system error");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your gear...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <CustomerProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={handleAddToCart}
            onRentClick={(p) => toast.info(`Rental for ${p.name} coming soon`)}
          />
        ))}
      </div>
    </div>
  );
}