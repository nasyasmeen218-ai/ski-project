import { useState } from "react";
import { toast } from "sonner";
import { register as registerApi } from "../../api/authApi";

function showApiError(err, fallback = "Something went wrong") {
  // Network / no response (server down, CORS, refused, timeout)
  if (!err?.response) {
    return "Cannot reach server. Make sure backend is running (port 8000)";
  }

  const status = err.response.status;

  // FastAPI often uses { detail: ... }
  const rawDetail = err?.response?.data?.detail ?? err?.response?.data?.message;

  // detail יכול להיות string או array/object (422)
  let detailText = "";
  if (typeof rawDetail === "string") {
    detailText = rawDetail;
  } else if (Array.isArray(rawDetail)) {
    // FastAPI validation errors: [{loc, msg, type}, ...]
    detailText = rawDetail.map((x) => x?.msg).filter(Boolean).join(", ");
  } else if (rawDetail && typeof rawDetail === "object") {
    detailText = JSON.stringify(rawDetail);
  } else {
    detailText = "";
  }

  // Status mapping
  if (status === 409) return "Username already exists";
  if (status === 401) return "Invalid username or password";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Endpoint not found";
  if (status === 422) return detailText || "Please check the form fields";
  if (status >= 500) return "Server error. Try again";

  // fallback to server message if exists
  return detailText || err?.message || fallback;
}

export default function Register({ onBackClick, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // ה-role הוסר מכאן בהתאם למשימה
  const [loading, setLoading] = useState(false);

  const toastOpts = { position: "top-center" };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Please enter username and password", toastOpts);
      return;
    }

    try {
      setLoading(true);
      // ✅ שינוי: שולחים רק username ו-password ללא role
      await registerApi(username.trim(), password);

      toast.success("Registered successfully! You can now sign in", toastOpts);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(showApiError(err, "Register failed"), toastOpts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Register</h1>

        <form onSubmit={handleRegister} className="space-y-3">
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
            autoComplete="new-password"
          />

          {/* ✅ שינוי: ה-select של ה-role הוסר מה-UI כנדרש */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <button
          onClick={onBackClick}
          className="mt-4 w-full text-sm text-blue-600 hover:underline"
          type="button"
        >
          Back
        </button>
      </div>
    </div>
  );
}