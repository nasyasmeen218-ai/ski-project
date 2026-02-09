import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { getMyOrders } from "../../api/ordersApi";

function safeDate(order) {
  const raw = order?.created_at ?? order?.createdAt ?? null;
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-10 text-center">
        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const items = Array.isArray(order?.items) ? order.items : [];

          return (
            <div key={order.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-bold">
                  Order #{String(order?.id || "").slice(0, 8)}
                </span>
                <span className="text-sm text-gray-500">{safeDate(order)}</span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                Status: <span className="font-semibold">{order?.status ?? "-"}</span>
              </div>

              {items.length === 0 ? (
                <div className="text-sm text-gray-500">No items</div>
              ) : (
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {items.map((item) => (
                    <li key={item.id}>
                      Product: {String(item.product_id || "").slice(0, 8)} · Qty:{" "}
                      {Number(item.qty || 0)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
