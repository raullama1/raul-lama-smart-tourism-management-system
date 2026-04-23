// client/src/socket.js
import { io } from "socket.io-client";

const socketStore = new Map();

function buildKey(scope, token) {
  return `${scope}::${token}`;
}

export function getScopedSocket(scope, token) {
  const base =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_ORIGIN ||
    "http://localhost:5001";

  if (!scope || !token) return null;

  const key = buildKey(scope, token);
  if (socketStore.has(key)) {
    return socketStore.get(key);
  }

  const socket = io(base, {
    transports: ["polling", "websocket"],
    auth: { token },
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
  });

  socket.on("connect", () => {
    socket.emit("user:join");
  });

  socketStore.set(key, socket);
  return socket;
}

export function getTouristSocket(token) {
  return getScopedSocket("tourist", token);
}

export function getAgencySocket(token) {
  return getScopedSocket("agency", token);
}

export function disconnectScopedSocket(scope, token) {
  if (!scope || !token) return;

  const key = buildKey(scope, token);
  const socket = socketStore.get(key);
  if (!socket) return;

  try {
    socket.removeAllListeners();
    socket.disconnect();
  } catch {
    // ignore
  } finally {
    socketStore.delete(key);
  }
}

export function disconnectAllSockets() {
  for (const [key, socket] of socketStore.entries()) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {
      // ignore
    } finally {
      socketStore.delete(key);
    }
  }
}