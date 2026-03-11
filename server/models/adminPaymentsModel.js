// server/models/adminPaymentsModel.js
import { db } from "../db.js";

function formatPaymentStatus(bookingStatus, paymentStatus) {
  const booking = String(bookingStatus || "");
  const payment = String(paymentStatus || "");

  if (payment === "Paid") return "Paid";
  if (booking === "Cancelled" && payment === "Unpaid") return "Failed";
  return "Pending";
}

function makePaymentId(id) {
  return `PMT-${String(id).padStart(6, "0")}`;
}

function normalizeSelectedDateLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const fromUntilMatch = raw.match(
    /^From\s+(\d{4}-\d{2}-\d{2})\s+until\s+(\d{4}-\d{2}-\d{2})$/i
  );
  if (fromUntilMatch) {
    return `From ${fromUntilMatch[1]} until ${fromUntilMatch[2]}`;
  }

  const arrowMatch = raw.match(/^(\d{4}-\d{2}-\d{2})\s*[→-]+\s*(\d{4}-\d{2}-\d{2})$/);
  if (arrowMatch) {
    return `From ${arrowMatch[1]} until ${arrowMatch[2]}`;
  }

  const pipeMatch = raw.match(/^(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})$/);
  if (pipeMatch) {
    return `From ${pipeMatch[1]} until ${pipeMatch[2]}`;
  }

  return raw;
}

function mapPaymentRow(row) {
  const esewaRefId = row.esewa_ref_id || "";
  const esewaTransactionCode = row.esewa_transaction_code || "";

  return {
    id: row.id,
    payment_id: makePaymentId(row.id),
    booking_ref: row.ref_code ? `#${row.ref_code}` : "-",
    tourist_name: row.tourist_name || "-",
    tourist_email: row.tourist_email || "-",
    agency_name: row.agency_name || "-",
    tour_title: row.tour_title || "-",
    amount: Number(row.total_price || 0),
    date: row.paid_at || row.created_at,
    status: formatPaymentStatus(row.booking_status, row.payment_status),
    booking_status: row.booking_status || "-",
    payment_status: row.payment_status || "-",
    payment_method: row.payment_method || "-",
    travelers: Number(row.travelers || 0),
    notes: row.notes || "",
    selected_date_label: normalizeSelectedDateLabel(row.selected_date_label),
    booking_date: row.booking_date || null,
    created_at: row.created_at || null,
    paid_at: row.paid_at || null,
    esewa_ref_id: esewaRefId,
    esewa_transaction_code: esewaTransactionCode,
    transaction_id: esewaTransactionCode || esewaRefId || `TXN-${row.id}`,
  };
}

export async function getAdminPaymentsModel() {
  const [rows] = await db.query(
    `
      SELECT
        b.id,
        b.ref_code,
        b.booking_date,
        b.booking_status,
        b.payment_status,
        b.payment_method,
        b.total_price,
        b.travelers,
        b.notes,
        b.selected_date_label,
        b.created_at,
        b.paid_at,
        b.esewa_ref_id,
        b.esewa_transaction_code,

        u.name AS tourist_name,
        u.email AS tourist_email,

        a.name AS agency_name,

        t.title AS tour_title
      FROM bookings b
      INNER JOIN users u ON u.id = b.user_id
      INNER JOIN agencies a ON a.id = b.agency_id
      INNER JOIN tours t ON t.id = b.tour_id
      ORDER BY
        CASE
          WHEN b.paid_at IS NOT NULL THEN b.paid_at
          ELSE b.created_at
        END DESC,
        b.id DESC
    `
  );

  return rows.map(mapPaymentRow);
}

export async function getAdminPaymentByIdModel(paymentId) {
  const [rows] = await db.query(
    `
      SELECT
        b.id,
        b.ref_code,
        b.booking_date,
        b.booking_status,
        b.payment_status,
        b.payment_method,
        b.total_price,
        b.travelers,
        b.notes,
        b.selected_date_label,
        b.created_at,
        b.paid_at,
        b.esewa_ref_id,
        b.esewa_transaction_code,

        u.name AS tourist_name,
        u.email AS tourist_email,

        a.name AS agency_name,

        t.title AS tour_title
      FROM bookings b
      INNER JOIN users u ON u.id = b.user_id
      INNER JOIN agencies a ON a.id = b.agency_id
      INNER JOIN tours t ON t.id = b.tour_id
      WHERE b.id = ?
      LIMIT 1
    `,
    [Number(paymentId)]
  );

  const row = rows[0];
  if (!row) return null;

  return mapPaymentRow(row);
}