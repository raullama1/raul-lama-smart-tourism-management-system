// server/models/notificationModel.js
import { db } from "../db.js";

function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase();
  if (r === "tourist" || r === "agency" || r === "admin") return r;
  return "";
}

function normalizeRow(row) {
  return {
    ...row,
    is_read: Number(row?.is_read || 0),
  };
}

export async function createNotification({
  userId,
  receiverRole,
  type = "general",
  title,
  message,
  actionPath = null,
  actionLabel = null,
  meta = null,
}) {
  const safeRole = normalizeRole(receiverRole);

  const [result] = await db.query(
    `
    INSERT INTO notifications
    (user_id, receiver_role, type, title, message, action_label, action_path, meta, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
    `,
    [
      Number(userId),
      safeRole,
      String(type || "general").trim(),
      String(title || "").trim(),
      String(message || "").trim(),
      actionLabel ? String(actionLabel).trim() : null,
      actionPath ? String(actionPath).trim() : null,
      meta ? JSON.stringify(meta) : null,
    ]
  );

  const insertId = result?.insertId;
  if (!insertId) return null;

  const [rows] = await db.query(
    `
    SELECT *
    FROM notifications
    WHERE id = ?
    LIMIT 1
    `,
    [insertId]
  );

  return rows?.[0] ? normalizeRow(rows[0]) : null;
}

export async function listNotifications({ userId, receiverRole, limit = 50, offset = 0 }) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 50;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;
  const safeRole = normalizeRole(receiverRole);

  const [rows] = await db.query(
    `
    SELECT *
    FROM notifications
    WHERE user_id = ?
      AND receiver_role = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
    OFFSET ?
    `,
    [Number(userId), safeRole, safeLimit, safeOffset]
  );

  return { notifications: rows.map(normalizeRow) };
}

export async function markNotificationRead({ userId, receiverRole, notificationId }) {
  const safeRole = normalizeRole(receiverRole);

  await db.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
      AND user_id = ?
      AND receiver_role = ?
    `,
    [Number(notificationId), Number(userId), safeRole]
  );
}

export async function markAllRead({ userId, receiverRole }) {
  const safeRole = normalizeRole(receiverRole);

  await db.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
      AND receiver_role = ?
      AND is_read = 0
    `,
    [Number(userId), safeRole]
  );
}

export async function getUnreadCount({ userId, receiverRole }) {
  const safeRole = normalizeRole(receiverRole);

  const [[row]] = await db.query(
    `
    SELECT COUNT(*) AS cnt
    FROM notifications
    WHERE user_id = ?
      AND receiver_role = ?
      AND is_read = 0
    `,
    [Number(userId), safeRole]
  );

  return Number(row?.cnt || 0);
}

export async function deleteNotification({ userId, receiverRole, notificationId }) {
  const safeRole = normalizeRole(receiverRole);

  await db.query(
    `
    DELETE FROM notifications
    WHERE id = ?
      AND user_id = ?
      AND receiver_role = ?
    `,
    [Number(notificationId), Number(userId), safeRole]
  );
}