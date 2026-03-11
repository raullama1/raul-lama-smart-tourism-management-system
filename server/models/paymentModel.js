// server/models/paymentModel.js
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

export async function markBookingPaid(
  bookingId,
  { esewaRefId = null, esewaTransactionCode = null } = {}
) {
  const [res] = await db.query(
    `
    UPDATE bookings
    SET payment_status = 'Paid',
        booking_status = 'Confirmed',
        payment_method = 'eSewa',
        paid_at = NOW(),
        esewa_ref_id = ?,
        esewa_transaction_code = ?
    WHERE id = ?
      AND payment_status = 'Unpaid'
    `,
    [esewaRefId, esewaTransactionCode, Number(bookingId)]
  );

  return res.affectedRows > 0;
}

export async function getBookingNotificationInfo(bookingId) {
  const [rows] = await db.query(
    `
    SELECT
      b.id,
      b.user_id,
      b.agency_id,
      b.ref_code,
      t.title AS tour_title
    FROM bookings b
    INNER JOIN tours t ON t.id = b.tour_id
    WHERE b.id = ?
    LIMIT 1
    `,
    [Number(bookingId)]
  );

  return rows[0] || null;
}