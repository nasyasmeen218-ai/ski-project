import { useState } from "react";
import { toast } from "sonner";
import { register as registerApi } from "../../api/authApi";
import { User, Lock, ArrowLeft, UserPlus, Loader2 } from "lucide-react";

// ייבוא הלוגו והרקע (וודאי ששם הקובץ הוא ski.png בתיקיית assets)
import logoImg from "../../assets/logo.png";
import bgImage from "../../assets/ski.png"; 

function showApiError(err, fallback = "Something went wrong") {
  if (!err?.response) return "Cannot reach server. Make sure backend is running (port 8000)";
  const status = err.response.status;
  const rawDetail = err?.response?.data?.detail ?? err?.response?.data?.message;
  let detailText = typeof rawDetail === "string" ? rawDetail : Array.isArray(rawDetail) ? rawDetail.map((x) => x?.msg).join(", ") : "";

  if (status === 409) return "Username already exists";
  if (status === 422) return detailText || "Please check the form fields";
  if (status >= 500) return "Server error. Try again";
  return detailText || err?.message || fallback;
}

export default function Register({ onBackClick, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      await registerApi(username.trim(), password);
      toast.success("Account created! You can now sign in");
      onSuccess?.();
    } catch (err) {
      toast.error(showApiError(err, "Register failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* שכבה עם טשטוש עדין מאוד (1px) וכהות של 20% - בדיוק כמו בלוגין */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"></div>

      {/* כרטיס ההרשמה עם אפקט זכוכית */}
      <div className="relative w-full max-w-md bg-white/85 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center mb-4 overflow-hidden">
             <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Register</h1>
          <p className="text-slate-600 mt-1 font-medium text-sm text-center">Create your staff account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/60 border border-slate-200 rounded-2xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
              autoComplete="username"
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
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 pt-6">
          <button
            onClick={onBackClick}
            className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-blue-600 font-bold transition-colors text-sm"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}