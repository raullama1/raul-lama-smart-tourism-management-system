// client/src/context/AgencyNotificationContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAgencyAuth } from "./AgencyAuthContext";
import { getAgencySocket } from "../socket";
import {
  fetchNotifications,
  markAllAsRead,
  markOneAsRead,
  deleteOneNotification,
  fetchUnreadCount,
} from "../api/notificationApi";

const AgencyNotificationContext = createContext(null);

export function AgencyNotificationProvider({ children }) {
  const { token, agency } = useAgencyAuth();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isReady = useMemo(() => !!token && !!agency?.id, [token, agency]);

  const refresh = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await fetchNotifications(token, { limit: 50, offset: 0 });
      setItems(res?.data?.notifications || []);

      const c = await fetchUnreadCount(token);
      setUnreadCount(Number(c?.data?.unreadCount || 0));
    } catch (e) {
      console.error("agency refresh notifications", e);
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
      console.error("agency refresh unread count", e);
    }
  };

  const markAllRead = async () => {
    if (!token) return;

    try {
      await markAllAsRead(token);

      setItems((prev) =>
        (prev || []).map((n) => ({
          ...n,
          is_read: 1,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (e) {
      console.error("agency markAllRead", e);
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
      console.error("agency markRead", e);
    }
  };

  const removeNotification = async (id) => {
    if (!token || !id) return;

    try {
      await deleteOneNotification(token, id);
      setItems((prev) => (prev || []).filter((n) => Number(n.id) !== Number(id)));
      await refreshUnreadOnly();
    } catch (e) {
      console.error("agency removeNotification", e);
    }
  };

  useEffect(() => {
    if (!isReady) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    refresh();

    const s = getAgencySocket(token);
    if (!s) return;

    const onNew = (notif) => {
      if (!notif?.id) return;

      setItems((prev) => {
        const exists = (prev || []).some((x) => Number(x.id) === Number(notif.id));
        if (exists) return prev;
        return [notif, ...(prev || [])];
      });

      if (Number(notif.is_read || 0) !== 1 && !notif.read_at) {
        setUnreadCount((c) => Number(c || 0) + 1);
      }
    };

    const onRefresh = () => {
      refreshUnreadOnly();
    };

    s.on("notification:new", onNew);
    s.on("notification:refresh", onRefresh);

    return () => {
      try {
        s.off("notification:new", onNew);
        s.off("notification:refresh", onRefresh);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, token, agency?.id]);

  return (
    <AgencyNotificationContext.Provider
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
    </AgencyNotificationContext.Provider>
  );
}

export function useAgencyNotifications() {
  return useContext(AgencyNotificationContext);
}