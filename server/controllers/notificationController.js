// server/controllers/notificationController.js
import {
  listNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
} from "../models/notificationModel.js";

/*
  GET /api/notifications?limit=10&offset=0
  Returns { notifications: [...] }
*/
export async function listMyNotificationsController(req, res) {
  try {
    const userId = req.user?.id;
    const { limit = 10, offset = 0 } = req.query;

    const data = await listNotifications(userId, Number(limit), Number(offset));
    return res.json(data);
  } catch (err) {
    console.error("listMyNotificationsController error", err);
    return res.status(500).json({ message: "Failed to load notifications." });
  }
}

/*
  GET /api/notifications/unread-count
  Returns { unreadCount: number }
*/
export async function getUnreadCountController(req, res) {
  try {
    const userId = req.user?.id;
    const unreadCount = await getUnreadCount(userId);
    return res.json({ unreadCount });
  } catch (err) {
    console.error("getUnreadCountController error", err);
    return res.status(500).json({ message: "Failed to load unread count." });
  }
}

/*
  PUT /api/notifications/:id/read
  Marks one notification as read (id must belong to user)
*/
export async function markOneReadController(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    await markNotificationRead(userId, id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("markOneReadController error", err);
    return res.status(500).json({ message: "Failed to mark as read." });
  }
}

/*
  PUT /api/notifications/read-all
  Marks all notifications as read
*/
export async function markAllReadController(req, res) {
  try {
    const userId = req.user?.id;

    await markAllRead(userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("markAllReadController error", err);
    return res.status(500).json({ message: "Failed to mark all as read." });
  }
}

/*
  DELETE /api/notifications/:id
  Deletes one notification (id must belong to user)
*/
export async function deleteOneNotificationController(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    await deleteNotification(userId, id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteOneNotificationController error", err);
    return res.status(500).json({ message: "Failed to delete notification." });
  }
}
