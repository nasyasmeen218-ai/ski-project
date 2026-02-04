import React from 'react';
import { ShoppingCart, Clock } from 'lucide-react';

export default function CustomerProductCard({ product, onAddToCart, onRentClick }) {
  const isOutOfStock = product.available_quantity === 0 || product.availableQuantity === 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full">
      <div className="h-48 bg-gray-50 flex items-center justify-center relative">
        {product.imageurl ? (
          <img src={product.imageurl} alt={product.name} className="object-contain h-full w-full p-2" />
        ) : (
          <div className="text-gray-300 flex flex-col items-center">
             <div className="w-12 h-12 border-2 border-gray-200 rounded-lg mb-2" />
             <span className="text-xs">No Image</span>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 leading-tight">{product.name}</h3>
          <span className="text-blue-600 font-extrabold text-xl">₪{product.price}</span>
        </div>

        <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-grow">
          {product.description || "High-quality equipment suitable for all mountain conditions."}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all font-semibold shadow-sm active:scale-95 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy</span>
          </button>

          <button
            onClick={() => onRentClick(product)}
            disabled={isOutOfStock}
            className="flex items-center justify-center gap-2 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:border-gray-200 disabled:text-gray-300 transition-all font-semibold active:scale-95 text-sm"
          >
            <Clock className="w-4 h-4" />
            <span>Rent</span>
          </button>
        </div>
      </div>
    </div>
  );
}