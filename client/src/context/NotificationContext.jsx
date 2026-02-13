// client/src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getSocket } from "../socket";
import {
  fetchNotifications,
  markAllAsRead,
  markOneAsRead,
  deleteOneNotification,
  fetchUnreadCount,
} from "../api/notificationApi";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();

  const socketRef = useRef(null);

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isReady = useMemo(() => !!token && !!user?.id, [token, user]);

  const refresh = async () => {
    if (!token) return;
    try {
      setLoading(true);

      const res = await fetchNotifications(token);
      setItems(res?.data?.notifications || []);

      const c = await fetchUnreadCount(token);
      setUnreadCount(Number(c?.data?.unreadCount || 0));
    } catch (e) {
      console.error("refresh notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshUnreadOnly = async () => {
    if (!token) return;
    try {
      const c = await fetchUnreadCount(token);
      setUnreadCount(Number(c?.data?.unreadCount || 0));
    } catch (e) {
      console.error("refresh unread count", e);
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);

      // Mark as read locally
      setItems((prev) =>
        (prev || []).map((n) => ({
          ...n,
          is_read: 1,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error("markAllRead", e);
    }
  };

  const markRead = async (id) => {
    if (!token || !id) return;
    try {
      await markOneAsRead(token, id);

      setItems((prev) =>
        (prev || []).map((n) =>
          Number(n.id) === Number(id)
            ? { ...n, is_read: 1, read_at: n.read_at || new Date().toISOString() }
            : n
        )
      );

      await refreshUnreadOnly();
    } catch (e) {
      console.error("markRead", e);
    }
  };

  const removeNotification = async (id) => {
    if (!token || !id) return;
    try {
      await deleteOneNotification(token, id);

      setItems((prev) => (prev || []).filter((n) => Number(n.id) !== Number(id)));

      await refreshUnreadOnly();
    } catch (e) {
      console.error("removeNotification", e);
    }
  };

  useEffect(() => {
    if (!isReady) return;

    refresh();

    const s = getSocket(token);
    socketRef.current = s;

    const onNew = (notif) => {
      setItems((prev) => [notif, ...(prev || [])]);
      setUnreadCount((c) => Number(c || 0) + 1);
    };

    const onRefresh = () => {
      refreshUnreadOnly();
    };

    s.on("notification:new", onNew);
    s.on("notification:refresh", onRefresh);

    // IMPORTANT: we DO NOT disconnect the socket here (shared socket)
    return () => {
      try {
        s.off("notification:new", onNew);
        s.off("notification:refresh", onRefresh);
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, token]);

  return (
    <NotificationContext.Provider
      value={{
        items,
        unreadCount,
        loading,
        refresh,
        markAllRead,
        markRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
