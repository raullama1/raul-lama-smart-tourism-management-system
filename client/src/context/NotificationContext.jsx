// // client/src/context/NotificationContext.jsx
// import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
// import { useAuth } from "./AuthContext";
// import { useAgencyAuth } from "./AgencyAuthContext";
// import { getSocket } from "../socket";
// import {
//   fetchNotifications,
//   markAllAsRead,
//   markOneAsRead,
//   deleteOneNotification,
//   fetchUnreadCount,
// } from "../api/notificationApi";

// const NotificationContext = createContext(null);

// export function NotificationProvider({ children }) {
//   const touristAuth = useAuth();
//   const agencyAuth = useAgencyAuth();

//   const touristToken = touristAuth?.token || null;
//   const touristUser = touristAuth?.user || null;

//   const agencyToken = agencyAuth?.token || null;
//   const agencyUser = agencyAuth?.agency || null;

//   const activeToken = agencyToken || touristToken || null;
//   const activeRole = agencyToken && agencyUser?.id ? "agency" : touristToken && touristUser?.id ? "tourist" : null;
//   const activeUser = activeRole === "agency" ? agencyUser : touristUser;
//   const activeUserId = Number(activeUser?.id || 0);

//   const socketRef = useRef(null);

//   const [items, setItems] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const isReady = useMemo(() => !!activeToken && !!activeRole && !!activeUserId, [activeToken, activeRole, activeUserId]);

//   const refresh = async () => {
//     if (!activeToken) return;

//     try {
//       setLoading(true);

//       const res = await fetchNotifications(activeToken, { limit: 50, offset: 0 });
//       setItems(res?.data?.notifications || []);

//       const c = await fetchUnreadCount(activeToken);
//       setUnreadCount(Number(c?.data?.unreadCount || 0));
//     } catch (e) {
//       console.error("refresh notifications", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshUnreadOnly = async () => {
//     if (!activeToken) return;

//     try {
//       const c = await fetchUnreadCount(activeToken);
//       setUnreadCount(Number(c?.data?.unreadCount || 0));
//     } catch (e) {
//       console.error("refresh unread count", e);
//     }
//   };

//   const markAllRead = async () => {
//     if (!activeToken) return;

//     try {
//       await markAllAsRead(activeToken);

//       setItems((prev) =>
//         (prev || []).map((n) => ({
//           ...n,
//           is_read: 1,
//           read_at: n.read_at || new Date().toISOString(),
//         }))
//       );

//       setUnreadCount(0);
//     } catch (e) {
//       console.error("markAllRead", e);
//     }
//   };

//   const markRead = async (id) => {
//     if (!activeToken || !id) return;

//     try {
//       await markOneAsRead(activeToken, id);

//       setItems((prev) =>
//         (prev || []).map((n) =>
//           Number(n.id) === Number(id)
//             ? { ...n, is_read: 1, read_at: n.read_at || new Date().toISOString() }
//             : n
//         )
//       );

//       await refreshUnreadOnly();
//     } catch (e) {
//       console.error("markRead", e);
//     }
//   };

//   const removeNotification = async (id) => {
//     if (!activeToken || !id) return;

//     try {
//       await deleteOneNotification(activeToken, id);

//       setItems((prev) => (prev || []).filter((n) => Number(n.id) !== Number(id)));
//       await refreshUnreadOnly();
//     } catch (e) {
//       console.error("removeNotification", e);
//     }
//   };

//   useEffect(() => {
//     if (!isReady) {
//       setItems([]);
//       setUnreadCount(0);
//       setLoading(false);
//       return;
//     }

//     refresh();

//     const s = getSocket(activeToken);
//     socketRef.current = s;

//     const onNew = (notif) => {
//       if (!notif?.id) return;

//       setItems((prev) => {
//         const exists = (prev || []).some((x) => Number(x.id) === Number(notif.id));
//         if (exists) return prev;
//         return [notif, ...(prev || [])];
//       });

//       if (Number(notif.is_read || 0) !== 1 && !notif.read_at) {
//         setUnreadCount((c) => Number(c || 0) + 1);
//       }
//     };

//     const onRefresh = () => {
//       refreshUnreadOnly();
//     };

//     s.on("notification:new", onNew);
//     s.on("notification:refresh", onRefresh);

//     return () => {
//       try {
//         s.off("notification:new", onNew);
//         s.off("notification:refresh", onRefresh);
//       } catch {
//         // ignore
//       }
//       socketRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isReady, activeToken, activeRole, activeUserId]);

//   return (
//     <NotificationContext.Provider
//       value={{
//         items,
//         unreadCount,
//         loading,
//         refresh,
//         markAllRead,
//         markRead,
//         removeNotification,
//         activeRole,
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export function useNotifications() {
//   return useContext(NotificationContext);
// }
