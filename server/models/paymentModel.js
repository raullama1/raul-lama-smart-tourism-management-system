import { db } from "../db.js";

export async function getBookingForPayment(userId, bookingId) {
  const [rows] = await db.query(
    `
    SELECT
      b.id,
      b.user_id,
      b.total_price,
      b.booking_status,
      b.payment_status,
      b.ref_code
    FROM bookings b
    WHERE b.id = ? AND b.user_id = ?
    LIMIT 1
    `,
    [Number(bookingId), Number(userId)]
  );
  return rows[0] || null;
}

export async function markBookingPaid(bookingId) {
  const [res] = await db.query(
    `
    UPDATE bookings
    SET payment_status='Paid', booking_status='Confirmed'
    WHERE id = ? AND payment_status='Unpaid'
    `,
    [Number(bookingId)]
  );
  return res.affectedRows > 0;
}
