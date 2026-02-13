// server/models/notificationModel.js
import { db } from "../db.js";

/*
  Notification Model

  Expected table columns:
  - id
  - user_id
  - title
  - message
  - action_path (optional)
  - action_label (optional)
  - is_read (tinyint) OR read_at (timestamp)
  - created_at
*/

/*
  Normalize DB row: make sure frontend can rely on "is_read" (0/1).
*/
function normalizeRow(row) {
  const hasIsRead = typeof row.is_read !== "undefined";
  const hasReadAt = typeof row.read_at !== "undefined";

  if (hasIsRead) return row;

  if (hasReadAt) {
    return {
      ...row,
      is_read: row.read_at ? 1 : 0,
    };
  }

  return row;
}

/*
  CREATE notification and return the inserted notification row.
  This is important because sockets emit the created object to the client.

  Usage examples:
  - chat socket: new message alert
  - booking updates
  - payment updates
  - password change alerts
*/
export async function createNotification({
  userId,
  title,
  message,
  actionPath = null,
  actionLabel = null,
}) {
  const [result] = await db.query(
    `
    INSERT INTO notifications
    (user_id, title, message, action_path, action_label, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, NOW())
    `,
    [userId, title, message, actionPath, actionLabel]
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

/*
  List notifications for a user
*/
export async function listNotifications(userId, limit = 10, offset = 0) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 10;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

  const [rows] = await db.query(
    `
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
    OFFSET ?
    `,
    [userId, safeLimit, safeOffset]
  );

  return { notifications: rows.map(normalizeRow) };
}

/*
  Mark one notification read
*/
export async function markNotificationRead(userId, notificationId) {
  try {
    await db.query(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
      `,
      [notificationId, userId]
    );
    return;
  } catch (e) {
    // If column is_read does not exist, fall back to read_at
  }

  await db.query(
    `
    UPDATE notifications
    SET read_at = NOW()
    WHERE id = ? AND user_id = ?
    `,
    [notificationId, userId]
  );
}

/*
  Mark all notifications read
*/
export async function markAllRead(userId) {
  try {
    await db.query(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND (is_read = 0 OR is_read IS NULL)
      `,
      [userId]
    );
    return;
  } catch (e) {
    // If column is_read does not exist, fall back to read_at
  }

  await db.query(
    `
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = ? AND read_at IS NULL
    `,
    [userId]
  );
}

/*
  Get unread count
*/
export async function getUnreadCount(userId) {
  try {
    const [[row]] = await db.query(
      `
      SELECT COUNT(*) AS cnt
      FROM notifications
      WHERE user_id = ? AND (is_read = 0 OR is_read IS NULL)
      `,
      [userId]
    );
    return Number(row?.cnt || 0);
  } catch (e) {
    // If column is_read does not exist, fall back to read_at
  }

  const [[row]] = await db.query(
    `
    SELECT COUNT(*) AS cnt
    FROM notifications
    WHERE user_id = ? AND read_at IS NULL
    `,
    [userId]
  );
  return Number(row?.cnt || 0);
}

/*
  Delete one notification
*/
export async function deleteNotification(userId, notificationId) {
  await db.query(
    `
    DELETE FROM notifications
    WHERE id = ? AND user_id = ?
    `,
    [notificationId, userId]
  );
}
