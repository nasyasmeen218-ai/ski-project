import { ShoppingCart, Calendar } from "lucide-react";

export default function CustomerProductCard({
  product,
  onBuy,
  onRent,
  rentDisabled = false,
}) {
  const imgSrc = product?.imageurl || product?.image || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="relative h-52 w-full bg-gray-50 flex items-center justify-center p-4 border-b border-gray-100">
        <img
          src={imgSrc}
          alt={product?.name || "product"}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.src =
              "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
          }}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 truncate">
          {product?.name}
        </h3>

        <p className="mt-2 text-blue-600 font-bold">
          ₪{Number(product?.price || 0).toFixed(2)}
        </p>

        {product?.rental_price > 0 && (
          <p className="mt-1 text-green-600 font-bold text-sm">
            ₪{Number(product.rental_price).toFixed(2)} / Day (Rent)
          </p>
        )}

        <div className="mt-3 text-sm text-gray-600">
          Available:{" "}
          <span className="font-semibold">
            {Number(product?.availableQuantity ?? 0)}
          </span>
        </div>

        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onBuy}
            className="h-10 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition flex items-center justify-center gap-2"
            type="button"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy
          </button>

          <button
            onClick={onRent}
            disabled={rentDisabled}
            className="h-10 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <Calendar className="w-4 h-4" />
            Rent
          </button>
        </div>
      </div>
    </div>
  );
}