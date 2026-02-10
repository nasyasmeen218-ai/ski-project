import { CheckCircle, ArrowRight } from "lucide-react";

export default function OrderSuccessMessage({ orderId, onViewOrders }) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center p-16 sm:p-20 text-center animate-in fade-in duration-500">
      {/* soft glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-green-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

      {/* confetti dots */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <span className="absolute left-8 top-10 h-2 w-2 rounded-full bg-green-400 animate-bounce [animation-delay:0ms]" />
        <span className="absolute left-24 top-16 h-2 w-2 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
        <span className="absolute right-10 top-12 h-2 w-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:240ms]" />
        <span className="absolute right-28 top-24 h-2 w-2 rounded-full bg-pink-400 animate-bounce [animation-delay:360ms]" />
        <span className="absolute left-1/2 top-8 h-2 w-2 -translate-x-1/2 rounded-full bg-purple-400 animate-bounce [animation-delay:480ms]" />
      </div>

      {/* icon ring */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
        <div className="absolute inset-0 rounded-full ring-4 ring-green-400/30 animate-ping [animation-duration:1200ms]" />
        <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg">
          <CheckCircle className="w-12 h-12 text-green-600 animate-bounce [animation-duration:900ms]" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        Your order is confirmed!
      </h2>

      <p className="text-gray-700">Your ski gear is reserved just for you.</p>
      <p className="text-gray-700">We’re getting everything ready.</p>
      <p className="text-gray-700 mt-2 font-semibold">
        Have an amazing ride ❄️
      </p>

      {orderId && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 shadow-sm">
          <span className="text-xs text-gray-500">Order</span>
          <span className="text-sm font-bold text-gray-900">
            #{orderId.slice(0, 8)}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onViewOrders}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-white font-bold hover:bg-black transition shadow-lg"
      >
        View My Orders
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
