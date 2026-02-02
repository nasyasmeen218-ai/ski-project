import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  path: "/socket.io",
  autoConnect: true,
});

export default socket;