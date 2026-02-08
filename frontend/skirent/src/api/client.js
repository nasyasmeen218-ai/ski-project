import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: false,
});

// תמיד להוסיף Authorization אם יש token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // אם אין token, לוודא שלא נשאר Authorization ישן
    if (config.headers?.Authorization) delete config.headers.Authorization;
  }

  return config;
});

export default api;
export { api };
