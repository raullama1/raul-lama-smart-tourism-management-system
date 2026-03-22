// server/models/reviewModel.js
import { db } from "../db.js";

export async function canUserReview(userId, bookingId) {
  const [rows] = await db.query(
    `
    SELECT
      b.*,
      at.listing_status AS agency_tour_listing_status
    FROM bookings b
    INNER JOIN agency_tours at ON at.id = b.agency_tour_id
    WHERE b.id = ?
      AND b.user_id = ?
      AND b.payment_status = 'Paid'
      AND b.booking_status = 'Completed'
      AND at.listing_status = 'completed'
    `,
    [bookingId, userId]
  );

  return rows[0] || null;
}

export async function hasReviewed(bookingId) {
  const [rows] = await db.query(
    `
    SELECT id
    FROM reviews
    WHERE booking_id = ?
    `,
    [bookingId]
  );

  return rows.length > 0;
}

export async function createReview({
  bookingId,
  userId,
  tourId,
  agencyId,
  rating,
  comment,
}) {
  const [result] = await db.query(
    `
    INSERT INTO reviews
      (booking_id, user_id, tour_id, agency_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [bookingId, userId, tourId, agencyId, rating, comment]
  );

  return result.insertId;
}

export async function getReviewsForTour(tourId, agencyId, currentUserId) {
  const [rows] = await db.query(
    `
    SELECT
      r.id,
      r.booking_id,
      r.user_id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS user_name,
      CASE
        WHEN r.user_id = ? THEN 1
        ELSE 0
      END AS is_owner
    FROM reviews r
    INNER JOIN users u ON u.id = r.user_id
    WHERE r.tour_id = ?
      AND r.agency_id = ?
    ORDER BY r.created_at DESC
    `,
    [currentUserId || 0, tourId, agencyId]
  );

  return rows.map((row) => ({
    ...row,
    is_owner: Boolean(row.is_owner),
  }));
}

export async function getReviewById(reviewId) {
  const [rows] = await db.query(
    `
    SELECT id, booking_id, user_id, rating, comment
    FROM reviews
    WHERE id = ?
    LIMIT 1
    `,
    [reviewId]
  );

  return rows[0] || null;
}

export async function updateReviewById(reviewId, { rating, comment }) {
  await db.query(
    `
    UPDATE reviews
    SET rating = ?, comment = ?
    WHERE id = ?
    `,
    [rating, comment, reviewId]
  );
}

export async function deleteReviewById(reviewId) {
  await db.query(
    `
    DELETE FROM reviews
    WHERE id = ?
    `,
    [reviewId]
  );
}