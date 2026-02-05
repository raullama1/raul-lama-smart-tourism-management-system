import { db } from "../db.js";

export async function getUserBookings(userId, filters = {}) {
  const { q = "", status = "All", date = "All" } = filters;

  const where = ["b.user_id = ?"];
  const params = [userId];

  // search: tour title or agency name
  if (q) {
    where.push("(t.title LIKE ? OR a.name LIKE ? OR b.ref_code LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  // status filter
  if (status && status !== "All") {
    where.push("b.booking_status = ?");
    params.push(status);
  }

  // date filter (simple, stable)
  // All | Last30 | Last90
  if (date === "Last30") {
    where.push("b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
  } else if (date === "Last90") {
    where.push("b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
  }

  const whereClause = `WHERE ${where.join(" AND ")}`;

  const [rows] = await db.query(
    `
    SELECT
      b.id,
      b.ref_code,
      b.booking_date,
      b.booking_status,
      b.payment_status,
      b.total_price,
      b.people_count,

      t.id AS tour_id,
      t.title AS tour_title,
      t.image_url AS tour_image_url,

      a.id AS agency_id,
      a.name AS agency_name
    FROM bookings b
    INNER JOIN tours t ON t.id = b.tour_id
    INNER JOIN agencies a ON a.id = b.agency_id
    ${whereClause}
    ORDER BY b.created_at DESC
    `,
    params
  );

  return rows;
}

export async function markBookingPaid(userId, bookingId) {
  const [res] = await db.query(
    `
    UPDATE bookings
    SET payment_status = 'Paid'
    WHERE id = ? AND user_id = ? AND booking_status <> 'Cancelled'
    `,
    [Number(bookingId), Number(userId)]
  );
  return res.affectedRows > 0;
}

export async function cancelBooking(userId, bookingId) {
  const [res] = await db.query(
    `
    UPDATE bookings
    SET booking_status = 'Cancelled'
    WHERE id = ? AND user_id = ? AND payment_status = 'Unpaid'
    `,
    [Number(bookingId), Number(userId)]
  );
  return res.affectedRows > 0;
}
