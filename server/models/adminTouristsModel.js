// server/models/adminTouristsModel.js
import { db } from "../db.js";

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

export async function getAdminTouristsModel({
  q = "",
  status = "all",
  sort = "newest",
}) {
  const conditions = [`u.role = 'tourist'`];
  const params = [];

  const trimmedQ = String(q || "").trim();
  const normalizedStatus = String(status || "all").trim().toLowerCase();
  const normalizedSort = String(sort || "newest").trim().toLowerCase();

  if (trimmedQ) {
    conditions.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    params.push(`%${trimmedQ}%`, `%${trimmedQ}%`);
  }

  if (normalizedStatus === "active") {
    conditions.push(`COALESCE(u.is_blocked, 0) = 0`);
  } else if (normalizedStatus === "blocked") {
    conditions.push(`COALESCE(u.is_blocked, 0) = 1`);
  }

  let orderBy = `u.created_at DESC, u.id DESC`;
  if (normalizedSort === "oldest") {
    orderBy = `u.created_at ASC, u.id ASC`;
  }

  const [rows] = await db.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COALESCE(u.is_blocked, 0) AS is_blocked,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT r.id) AS total_reviews,
        COUNT(DISTINCT w.id) AS total_wishlists
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      LEFT JOIN reviews r ON r.user_id = u.id
      LEFT JOIN wishlists w ON w.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at, u.is_blocked
      ORDER BY ${orderBy}
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    is_blocked: Number(row.is_blocked) === 1,
    created_at: formatDateOnly(row.created_at),
    total_bookings: Number(row.total_bookings || 0),
    total_reviews: Number(row.total_reviews || 0),
    total_wishlists: Number(row.total_wishlists || 0),
  }));
}

export async function getAdminTouristByIdModel(userId) {
  const [rows] = await db.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COALESCE(u.is_blocked, 0) AS is_blocked,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT r.id) AS total_reviews,
        COUNT(DISTINCT w.id) AS total_wishlists
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      LEFT JOIN reviews r ON r.user_id = u.id
      LEFT JOIN wishlists w ON w.user_id = u.id
      WHERE u.id = ?
        AND u.role = 'tourist'
      GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at, u.is_blocked
      LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    is_blocked: Number(row.is_blocked) === 1,
    created_at: formatDateOnly(row.created_at),
    total_bookings: Number(row.total_bookings || 0),
    total_reviews: Number(row.total_reviews || 0),
    total_wishlists: Number(row.total_wishlists || 0),
  };
}

export async function updateAdminTouristBlockedStatusModel(userId, isBlocked) {
  const [result] = await db.query(
    `
      UPDATE users
      SET is_blocked = ?
      WHERE id = ?
        AND role = 'tourist'
      LIMIT 1
    `,
    [isBlocked ? 1 : 0, userId]
  );

  return result;
}