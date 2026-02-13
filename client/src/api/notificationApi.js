// client/src/api/notificationApi.js
import api from "./apiClient";

/*
  Notes:
  - This file exports BOTH:
    - the "new" names used by NotificationContext.jsx
    - and the older names you already had
  - This prevents import errors and keeps your code backwards compatible.
*/

/* ---------------------- Existing exports (keep) ---------------------- */

export function fetchMyNotifications(token, { limit = 10, offset = 0 } = {}) {
  return api.get(`/notifications?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function markNotificationRead(token, id) {
  return api.put(
    `/notifications/${id}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export function markAllNotificationsRead(token) {
  return api.put(
    `/notifications/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

/* ---------------------- New exports (used by context) ---------------------- */

/*
  Fetch notifications (default limit/offset).
  Your controller can ignore limit/offset if not implemented.
*/
export function fetchNotifications(token, { limit = 10, offset = 0 } = {}) {
  return fetchMyNotifications(token, { limit, offset });
}

/* Mark one notification as read */
export function markOneAsRead(token, id) {
  return markNotificationRead(token, id);
}

/* Mark all as read */
export function markAllAsRead(token) {
  return markAllNotificationsRead(token);
}

/*
  Delete one notification.
  Requires backend route: DELETE /api/notifications/:id
  If you didn't build delete route, remove usage from context.
*/
export function deleteOneNotification(token, id) {
  return api.delete(`/notifications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/*
  Get unread count.
  Requires backend route: GET /api/notifications/unread-count
*/
export function fetchUnreadCount(token) {
  return api.get(`/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
