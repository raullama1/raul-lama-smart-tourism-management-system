// client/src/socket.js
import { io } from "socket.io-client";

export function createSocket(token) {
  // Use the same base as your API server (no /api at the end)
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  return io(base, {
    transports: ["websocket"],
    auth: { token },
    autoConnect: true,
    withCredentials: true,
  });
}
