// client/src/socket.js
import { io } from "socket.io-client";

let socketInstance = null;
let socketToken = null;

export function getSocket(token) {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  // Reuse same socket if token is same
  if (socketInstance && socketToken === token) return socketInstance;

  // Token changed or first time -> disconnect old
  if (socketInstance) {
    try {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    } catch {
      // ignore
    }
    socketInstance = null;
    socketToken = null;
  }

  socketToken = token;

  socketInstance = io(base, {
    // Allow fallback. DO NOT force only websocket.
    transports: ["polling", "websocket"],
    auth: { token },
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
  });

  socketInstance.on("connect", () => {
    socketInstance.emit("user:join");
  });

  return socketInstance;
}

export function disconnectSocket() {
  if (!socketInstance) return;
  try {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
  } catch {
    // ignore
  } finally {
    socketInstance = null;
    socketToken = null;
  }
}
