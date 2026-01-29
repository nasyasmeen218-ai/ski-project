import { useState } from "react";
import { login } from "../../api/authApi";
import { toast } from "sonner";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";

// ייבוא הלוגו והרקע שלך
import logoImg from "../../assets/logo.png"; 
import bgImage from "../../assets/ski.png"; 

function showApiError(err, fallback = "Something went wrong") {
  if (!err?.response) return "Cannot reach server. Make sure backend is running (port 8000)";
  const status = err.response.status;
  const rawDetail = err?.response?.data?.detail ?? err?.response?.data?.message;
  let detailText = typeof rawDetail === "string" ? rawDetail : Array.isArray(rawDetail) ? rawDetail.map((x) => x?.msg).join(", ") : "";
  if (status === 401) return "Invalid username or password";
  if (status === 422) return detailText || "Please check the form fields";
  if (status >= 500) return "Server error. Try again";
  return detailText || err?.message || fallback;
}

export default function Login({ onRegisterClick, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Please enter username and password");
      return;
    }
    try {
      setLoading(true);
      const data = await login(username.trim(), password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("username", data.user.username);
      toast.success("Welcome back!");
      onLoginSuccess?.();
    } catch (err) {
      toast.error(showApiError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* שכבה עם טשטוש כמעט אפסי (1px) וכהות עדינה מאוד (20%) כדי שהתמונה תהיה חדה */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"></div>

      {/* כרטיס הלוגין - השארתי את הטשטוש על הכרטיס עצמו כי זה נותן מראה זכוכית יוקרתי */}
      <div className="relative w-full max-w-md bg-white/85 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-8 transition-all">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center mb-4 overflow-hidden">
            <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Login</h1>
          <p className="text-slate-600 mt-1 font-medium text-sm">Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/60 border border-slate-200 rounded-2xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/60 border border-slate-200 rounded-2xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={onRegisterClick}
            className="text-blue-700 hover:text-blue-800 font-bold text-sm underline-offset-4 hover:underline transition-colors"
            type="button"
          >
            Don't have an account? Register here
          </button>
        </div>
      </div>
    </div>
  );
}