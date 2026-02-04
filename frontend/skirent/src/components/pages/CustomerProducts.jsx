import { useState, useEffect } from "react";
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
        const data = await getProducts(); 
        console.log("Check this object in console:", data[0]);

        const mappedData = data.map(p => ({
          ...p,
          price: p.price ?? p.unit_price ?? p.price_per_unit ?? p.daily_price ?? 0,
          image: p.imageurl ? `http://127.0.0.1:8000/${p.imageurl}` : null
        }));
        setProducts(mappedData);
      } catch (err) {
        toast.error("Failed to fetch products");
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed");
      }
      
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.message || "Out of stock or system error");
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
            onAddToCart={() => handleAddToCart(product)}
            onRentClick={(p) => toast.info(`Rental for ${p.name} coming soon`)}
          />
        ))}
      </div>
    </div>
  );
}