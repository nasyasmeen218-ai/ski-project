import axios from "axios";

// ✅ חשוב: לאחד ל-localhost (כדי שה-origin יהיה יציב)
// אם תרצי 127.0.0.1 — אפשר, אבל אז ודאי שגם CORS מאפשר אותו.
export const API_BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// attach token automatically (safe)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // במצבי edge הדפדפן יכול לחסום storage
    console.warn("Cannot access localStorage token:", e);
  }
  return config;
});
