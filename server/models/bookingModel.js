// server/models/bookingModel.js
import { db } from "../db.js";

/* =========================
   HELPERS
   ========================= */
function safeYMD(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.slice(0, 10); // supports YYYY-MM-DD and datetime strings
}

function parsePipeRange(raw) {
  const s = String(raw || "").trim();
  if (!s || !s.includes("|")) return { start: "", end: "" };
  const [a, b] = s.split("|");
  return { start: safeYMD(a), end: safeYMD(b) };
}

function makeRangeLabel(start, end) {
  const a = safeYMD(start);
  const b = safeYMD(end);
  if (!a || !b) return "";
  return `${a} → ${b}`;
}

/* =========================
   LIST USER BOOKINGS
   ========================= */
export async function getUserBookings(userId, filters = {}) {
  const { q = "", status = "All", date = "All" } = filters;

  const where = ["b.user_id = ?"];
  const params = [userId];

  if (q) {
    where.push("(t.title LIKE ? OR a.name LIKE ? OR b.ref_code LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (status && status !== "All") {
    where.push("b.booking_status = ?");
    params.push(status);
  }

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
      b.travelers,
      b.selected_date_label,

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

/* =========================
   MARK BOOKING AS PAID
   ========================= */
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

/* =========================
   CANCEL BOOKING
   ========================= */
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

/* =========================
   BOOKING PREVIEW DATA
   ========================= */
export async function fetchBookingPreviewByAgencyTourId(agencyTourId) {
  const [rows] = await db.query(
    `
    SELECT
      at.id AS agency_tour_id,
      at.tour_id,
      at.agency_id,
      at.price,
      at.available_dates,
      at.start_date,
      at.end_date,
      at.listing_status,

      t.title AS tour_title,
      a.name AS agency_name
    FROM agency_tours at
    INNER JOIN tours t ON t.id = at.tour_id
    INNER JOIN agencies a ON a.id = at.agency_id
    WHERE at.id = ?
      AND at.listing_status = 'active'
    LIMIT 1
    `,
    [Number(agencyTourId)]
  );

  if (!rows[0]) return null;

  const r = rows[0];

  // Normalize start/end for frontend (fallback for old rows)
  const start = safeYMD(r.start_date) || parsePipeRange(r.available_dates).start;
  const end = safeYMD(r.end_date) || parsePipeRange(r.available_dates).end;

  return {
    ...r,
    start_date: start || null,
    end_date: end || null,
  };
}

/* =========================
   GENERATE BOOKING REF
   ========================= */
function makeBookingRef(tourTitle = "") {
  const code = (tourTitle || "TOUR")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");

  const num = Math.floor(1000 + Math.random() * 9000);
  return `NP-${code}-${num}`;
}

/* =========================
   CREATE BOOKING
   ========================= */
export async function insertBooking({
  userId,
  agencyTourId,
  travelers,
  notes,
  selectedDateLabel,
}) {
  const preview = await fetchBookingPreviewByAgencyTourId(Number(agencyTourId));
  if (!preview) return null; // includes active-only rule

  // Validate selectedDateLabel must match the listing’s season
  const expectedLabel = makeRangeLabel(preview.start_date, preview.end_date);
  if (!expectedLabel) return null;

  if (String(selectedDateLabel || "").trim() !== expectedLabel) {
    return null;
  }

  const bookingRef = makeBookingRef(preview.tour_title);
  const totalPrice = Number(preview.price) * Number(travelers);

  const [res] = await db.query(
    `
    INSERT INTO bookings
      (
        user_id,
        agency_id,
        tour_id,
        agency_tour_id,
        ref_code,
        booking_date,
        travelers,
        notes,
        selected_date_label,
        total_price,
        booking_status,
        payment_status
      )
    VALUES
      (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, 'Pending', 'Unpaid')
    `,
    [
      Number(userId),
      Number(preview.agency_id),
      Number(preview.tour_id),
      Number(preview.agency_tour_id),
      bookingRef,
      Number(travelers),
      notes ?? null,
      expectedLabel,
      totalPrice,
    ]
  );

  // Return what we actually saved (helps debug traveler mismatch)
  return {
    id: res.insertId,
    ref_code: bookingRef,
    travelers: Number(travelers),
    selected_date_label: expectedLabel,
    booking_status: "Pending",
    payment_status: "Unpaid",
    total_price: totalPrice,
  };
}