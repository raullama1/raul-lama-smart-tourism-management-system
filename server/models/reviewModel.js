// server/models/reviewModel.js
import { db } from "../db.js"; // ✅ FIX: named import

export async function canUserReview(userId, bookingId) {
  const [rows] = await db.query(
    `
    SELECT b.*
    FROM bookings b
    WHERE b.id = ?
      AND b.user_id = ?
      AND b.payment_status = 'Paid'
      AND b.booking_status = 'Completed'
    `,
    [bookingId, userId]
  );

  return rows[0] || null;
}

export async function hasReviewed(bookingId) {
  const [rows] = await db.query(
    "SELECT id FROM reviews WHERE booking_id = ?",
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
  await db.query(
    `
    INSERT INTO reviews
      (booking_id, user_id, tour_id, agency_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [bookingId, userId, tourId, agencyId, rating, comment]
  );
}

export async function getReviewsForTour(tourId, agencyId) {
  const [rows] = await db.query(
    `
    SELECT r.rating, r.comment, r.created_at
    FROM reviews r
    WHERE r.tour_id = ?
      AND r.agency_id = ?
    ORDER BY r.created_at DESC
    `,
    [tourId, agencyId]
  );

  return rows;
}
