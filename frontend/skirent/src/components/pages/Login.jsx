import { useState } from "react";
import { login } from "../../api/authApi";
import { toast } from "sonner";

function showApiError(err, fallback = "Something went wrong") {
  // Network / no response (server down, CORS, refused, timeout)
  if (!err?.response) {
    return "Cannot reach server. Make sure backend is running (port 8000)";
  }

  const status = err.response.status;

  // FastAPI often uses { detail: ... }
  const rawDetail = err?.response?.data?.detail ?? err?.response?.data?.message;

  let detailText = "";
  if (typeof rawDetail === "string") {
    detailText = rawDetail;
  } else if (Array.isArray(rawDetail)) {
    detailText = rawDetail.map((x) => x?.msg).filter(Boolean).join(", ");
  } else if (rawDetail && typeof rawDetail === "object") {
    detailText = JSON.stringify(rawDetail);
  }

  // Status mapping (login-specific)
  if (status === 401) return "Invalid username or password";
  if (status === 403) return "Access forbidden";
  if (status === 404) return "Endpoint not found";
  if (status === 422) return detailText || "Please check the form fields";
  if (status >= 500) return "Server error. Try again";

  return detailText || err?.message || fallback;
}

export default function Login({ onRegisterClick, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const toastOpts = { position: "top-center" };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Please enter username and password", toastOpts);
      return;
    }

    try {
      setLoading(true);

      const data = await login(username.trim(), password);

      // ✅ Safe localStorage writes
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("username", data.user.username);
      } catch (e) {
        console.error("Failed to write to localStorage", e);
        toast.error("Browser storage error", toastOpts);
        return;
      }

      toast.success("Logged in successfully", toastOpts);

      // 🔑 Notify App.jsx that login succeeded
      onLoginSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(showApiError(err, "Login failed"), toastOpts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2"
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          onClick={onRegisterClick}
          className="mt-4 w-full text-sm text-blue-600 hover:underline"
          type="button"
        >
          Go to Register
        </button>
      </div>
    </div>
  );
}
