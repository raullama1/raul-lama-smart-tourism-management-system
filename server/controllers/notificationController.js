// server/controllers/notificationController.js
import {
  listNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
} from "../models/notificationModel.js";

export async function listMyNotificationsController(req, res) {
  try {
    const userId = Number(req.user?.id || 0);
    const receiverRole = String(req.user?.role || "").trim();
    const { limit = 50, offset = 0 } = req.query;

    const data = await listNotifications({
      userId,
      receiverRole,
      limit: Number(limit),
      offset: Number(offset),
    });

    return res.json(data);
  } catch (err) {
    console.error("listMyNotificationsController error", err);
    return res.status(500).json({ message: "Failed to load notifications." });
  }
}

export async function getUnreadCountController(req, res) {
  try {
    const userId = Number(req.user?.id || 0);
    const receiverRole = String(req.user?.role || "").trim();

    const unreadCount = await getUnreadCount({ userId, receiverRole });
    return res.json({ unreadCount });
  } catch (err) {
    console.error("getUnreadCountController error", err);
    return res.status(500).json({ message: "Failed to load unread count." });
  }
}

export async function markOneReadController(req, res) {
  try {
    const userId = Number(req.user?.id || 0);
    const receiverRole = String(req.user?.role || "").trim();
    const { id } = req.params;

    await markNotificationRead({ userId, receiverRole, notificationId: id });
    return res.json({ ok: true });
  } catch (err) {
    console.error("markOneReadController error", err);
    return res.status(500).json({ message: "Failed to mark as read." });
  }
}

export async function markAllReadController(req, res) {
  try {
    const userId = Number(req.user?.id || 0);
    const receiverRole = String(req.user?.role || "").trim();

    await markAllRead({ userId, receiverRole });
    return res.json({ ok: true });
  } catch (err) {
    console.error("markAllReadController error", err);
    return res.status(500).json({ message: "Failed to mark all as read." });
  }
}

export async function deleteOneNotificationController(req, res) {
  try {
    const userId = Number(req.user?.id || 0);
    const receiverRole = String(req.user?.role || "").trim();
    const { id } = req.params;

    await deleteNotification({ userId, receiverRole, notificationId: id });
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteOneNotificationController error", err);
    return res.status(500).json({ message: "Failed to delete notification." });
  }
}