// server/models/bookingModel.js
import { db } from "../db.js";

function safeYMD(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.slice(0, 10);
}

function parsePipeRange(raw) {
  const s = String(raw || "").trim();
  if (!s || !s.includes("|")) return { start: "", end: "" };
  const [a, b] = s.split("|");
  return { start: safeYMD(a), end: safeYMD(b) };
}

function parseArrowRange(raw) {
  const s = String(raw || "").trim();
  if (!s || !s.includes("→")) return { start: "", end: "" };
  const [a, b] = s.split("→");
  return { start: safeYMD(a), end: safeYMD(b) };
}

function parseLegacyTextRange(raw) {
  const s = String(raw || "").trim();
  const match = s.match(
    /^From\s+(\d{4}-\d{2}-\d{2})\s+until\s+(\d{4}-\d{2}-\d{2})$/i
  );

  if (!match) return { start: "", end: "" };

  return {
    start: safeYMD(match[1]),
    end: safeYMD(match[2]),
  };
}

function makeRangeLabel(start, end) {
  const a = safeYMD(start);
  const b = safeYMD(end);
  if (!a || !b) return "";
  return `${a} → ${b}`;
}

function normalizeSelectedDateLabel(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  const arrow = parseArrowRange(value);
  if (arrow.start && arrow.end) {
    return makeRangeLabel(arrow.start, arrow.end);
  }

  const legacy = parseLegacyTextRange(value);
  if (legacy.start && legacy.end) {
    return makeRangeLabel(legacy.start, legacy.end);
  }

  const pipe = parsePipeRange(value);
  if (pipe.start && pipe.end) {
    return makeRangeLabel(pipe.start, pipe.end);
  }

  return value;
}

function normalizeTravelers(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;

  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 99) return null;

  return n;
}

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

export async function markBookingPaid(userId, bookingId) {
  const [[row]] = await db.query(
    `
    SELECT
      b.id,
      b.booking_status,
      b.payment_status,
      at.listing_status
    FROM bookings b
    INNER JOIN agency_tours at ON at.id = b.agency_tour_id
    WHERE b.id = ? AND b.user_id = ?
    LIMIT 1
    `,
    [Number(bookingId), Number(userId)]
  );

  if (!row) return false;

  const bookingStatus = String(row.booking_status || "");
  const paymentStatus = String(row.payment_status || "");
  const listingStatus = String(row.listing_status || "").toLowerCase();

  if (bookingStatus === "Cancelled" || bookingStatus === "Completed") {
    return false;
  }

  if (paymentStatus === "Paid") {
    return true;
  }

  let nextBookingStatus = bookingStatus;

  if (listingStatus === "completed") {
    nextBookingStatus = "Completed";
  } else if (bookingStatus === "Approved") {
    nextBookingStatus = "Confirmed";
  }

  const [res] = await db.query(
    `
    UPDATE bookings
    SET payment_status = 'Paid', booking_status = ?
    WHERE id = ? AND user_id = ? AND booking_status <> 'Cancelled'
    `,
    [nextBookingStatus, Number(bookingId), Number(userId)]
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
  const start = safeYMD(r.start_date) || parsePipeRange(r.available_dates).start;
  const end = safeYMD(r.end_date) || parsePipeRange(r.available_dates).end;

  return {
    ...r,
    start_date: start || null,
    end_date: end || null,
  };
}

function makeBookingRef(tourTitle = "") {
  const code = (tourTitle || "TOUR")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");

  const num = Math.floor(1000 + Math.random() * 9000);
  return `NP-${code}-${num}`;
}

export async function insertBooking({
  userId,
  agencyTourId,
  travelers,
  notes,
  selectedDateLabel,
}) {
  const preview = await fetchBookingPreviewByAgencyTourId(Number(agencyTourId));
  if (!preview) return null;

  const expectedLabel = makeRangeLabel(preview.start_date, preview.end_date);
  if (!expectedLabel) return null;

  const normalizedSelectedDateLabel = normalizeSelectedDateLabel(selectedDateLabel);
  if (normalizedSelectedDateLabel !== expectedLabel) {
    return null;
  }

  const savedTravelers = normalizeTravelers(travelers);
  if (!savedTravelers) {
    return null;
  }

  const bookingRef = makeBookingRef(preview.tour_title);
  const totalPrice = Number(preview.price) * savedTravelers;

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
      savedTravelers,
      notes ?? null,
      expectedLabel,
      totalPrice,
    ]
  );

  return {
    id: res.insertId,
    ref_code: bookingRef,
    travelers: savedTravelers,
    selected_date_label: expectedLabel,
    booking_status: "Pending",
    payment_status: "Unpaid",
    total_price: totalPrice,
  };
}