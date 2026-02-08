import { io } from "socket.io-client";

export const socket = io("http://localhost:8000", {
  path: "/socket.io",          // ✅ תואם ל-main.py
  transports: ["polling", "websocket"],
});

socket.on("connect", () => console.log("✅ socket connected", socket.id));
socket.on("connect_error", (err) => console.log("❌ socket error", err.message));

export default socket;
