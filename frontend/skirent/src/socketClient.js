import { io } from "socket.io-client";

const URL = "http://127.0.0.1:8000";

export const socket = io(URL, {
  path: "/socket.io",
  transports: ["polling", "websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
});

socket.on("connect", () => console.log("✅ socket connected", socket.id));
socket.on("disconnect", (reason) => console.log("⚠️ socket disconnected:", reason));
socket.on("connect_error", (err) => console.log("❌ socket error:", err?.message || err));
