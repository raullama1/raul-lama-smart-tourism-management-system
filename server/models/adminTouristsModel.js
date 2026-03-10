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

  const [bookingRows] = await db.query(
    `
      SELECT
        b.id,
        b.ref_code,
        b.booking_date,
        b.booking_status,
        b.total_price,
        t.title AS tour_title
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC, b.id DESC
    `,
    [userId]
  );

  const [reviewRows] = await db.query(
    `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        t.title AS tour_title
      FROM reviews r
      INNER JOIN tours t ON t.id = r.tour_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC, r.id DESC
    `,
    [userId]
  );

  return {
    ...row,
    is_blocked: Number(row.is_blocked) === 1,
    created_at: formatDateOnly(row.created_at),
    total_bookings: Number(row.total_bookings || 0),
    total_reviews: Number(row.total_reviews || 0),
    total_wishlists: Number(row.total_wishlists || 0),
    bookings: bookingRows.map((booking) => ({
      id: booking.id,
      reference: booking.ref_code ? `#${booking.ref_code}` : `#BK-${booking.id}`,
      tour_title: booking.tour_title,
      booking_date: formatDateOnly(booking.booking_date),
      booking_status: booking.booking_status,
      total_price: Number(booking.total_price || 0),
    })),
    reviews: reviewRows.map((review) => ({
      id: review.id,
      tour_title: review.tour_title,
      rating: Number(review.rating || 0),
      comment: review.comment || "",
      created_at: formatDateOnly(review.created_at),
    })),
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

export async function deleteAdminTouristReviewModel(userId, reviewId) {
  const [result] = await db.query(
    `
      DELETE FROM reviews
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [reviewId, userId]
  );

  return result;
}