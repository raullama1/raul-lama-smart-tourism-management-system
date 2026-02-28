// server/controllers/agencyBookingsController.js
import { db } from "../db.js";

function requireAgency(req, res) {
  const agencyId = req.user?.id;
  const role = req.user?.role;

  if (!agencyId || role !== "agency") {
    res.status(401).json({ message: "Agency authentication required." });
    return null;
  }
  return agencyId;
}

function normStatus(v) {
  const s = String(v || "").toLowerCase().trim();
  const ok = ["all", "pending", "approved", "confirmed", "completed", "cancelled"];
  return ok.includes(s) ? s : "all";
}

function toDbBookingStatus(tabStatus) {
  const s = String(tabStatus || "").toLowerCase().trim();
  if (s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "confirmed") return "Confirmed";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return "";
}

function normPayment(v) {
  const s = String(v || "").toLowerCase().trim();
  const ok = ["all", "paid", "unpaid"];
  return ok.includes(s) ? s : "all";
}

function toDbPaymentStatus(v) {
  const s = String(v || "").toLowerCase().trim();
  if (s === "paid") return "Paid";
  if (s === "unpaid") return "Unpaid";
  return "";
}

function normSort(v) {
  const s = String(v || "").toLowerCase().trim();
  return s === "oldest" ? "oldest" : "latest";
}

export async function listAgencyBookingsController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const status = normStatus(req.query.status);
    const payment = normPayment(req.query.payment);
    const sort = normSort(req.query.sort);
    const q = String(req.query.q || "").trim();

    const where = ["b.agency_id = ?"];
    const params = [agencyId];

    if (status !== "all") {
      where.push("b.booking_status = ?");
      params.push(toDbBookingStatus(status));
    }

    if (payment !== "all") {
      where.push("b.payment_status = ?");
      params.push(toDbPaymentStatus(payment));
    }

    if (q) {
      where.push("(t.title LIKE ? OR u.name LIKE ? OR b.ref_code LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;
    const orderSql =
      sort === "oldest"
        ? "ORDER BY b.created_at ASC"
        : "ORDER BY b.created_at DESC";

    const [rows] = await db.query(
      `
      SELECT
        b.id AS booking_id,
        b.ref_code,
        b.booking_date,
        b.created_at,
        b.travelers,
        b.booking_status,
        b.payment_status,
        b.total_price,
        b.selected_date_label,
        b.notes,

        t.title AS tour_title,
        t.location AS tour_location,

        u.name AS tourist_name,
        u.email AS tourist_email

      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      INNER JOIN users u ON u.id = b.user_id
      ${whereSql}
      ${orderSql}
      `,
      params
    );

    return res.json({ data: rows });
  } catch (err) {
    console.error("listAgencyBookingsController error", err);
    return res.status(500).json({ message: "Failed to load bookings." });
  }
}

/**
 * Booking details for agency
 * Includes tour listing status to keep details status consistent when tour is completed.
 */
export async function getAgencyBookingDetailsController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const [[row]] = await db.query(
      `
      SELECT
        b.id AS booking_id,
        b.ref_code,
        b.booking_date,
        b.created_at,
        b.travelers,
        b.notes,
        b.selected_date_label,
        b.total_price,
        b.booking_status,
        b.payment_status,
        b.payment_method,
        b.paid_at,

        t.id AS tour_id,
        t.title AS tour_title,
        t.location AS tour_location,
        t.image_url AS tour_image_url,
        t.long_description AS tour_description,

        at.id AS agency_tour_id,
        at.price AS agency_price_per_person,
        at.available_dates AS agency_available_dates,
        at.listing_status AS tour_listing_status,

        u.id AS tourist_id,
        u.name AS tourist_name,
        u.email AS tourist_email

      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      INNER JOIN agency_tours at ON at.id = b.agency_tour_id
      INNER JOIN users u ON u.id = b.user_id
      WHERE b.id = ? AND b.agency_id = ?
      LIMIT 1
      `,
      [bookingId, agencyId]
    );

    if (!row) return res.status(404).json({ message: "Booking not found." });

    return res.json({ data: row });
  } catch (err) {
    console.error("getAgencyBookingDetailsController error", err);
    return res.status(500).json({ message: "Failed to load booking details." });
  }
}

export async function approveAgencyBookingController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const [[row]] = await db.query(
      `
      SELECT b.id, b.booking_status, b.payment_status
      FROM bookings b
      WHERE b.id = ? AND b.agency_id = ?
      LIMIT 1
      `,
      [bookingId, agencyId]
    );

    if (!row) return res.status(404).json({ message: "Booking not found." });

    if (String(row.booking_status) !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be approved." });
    }

    if (String(row.payment_status) !== "Unpaid") {
      return res
        .status(400)
        .json({ message: "Cannot approve: payment is already marked paid." });
    }

    await db.query(
      `UPDATE bookings SET booking_status = 'Approved' WHERE id = ? AND agency_id = ?`,
      [bookingId, agencyId]
    );

    return res.json({ message: "Booking approved." });
  } catch (err) {
    console.error("approveAgencyBookingController error", err);
    return res.status(500).json({ message: "Failed to approve booking." });
  }
}

export async function rejectAgencyBookingController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const [[row]] = await db.query(
      `
      SELECT b.id, b.booking_status
      FROM bookings b
      WHERE b.id = ? AND b.agency_id = ?
      LIMIT 1
      `,
      [bookingId, agencyId]
    );

    if (!row) return res.status(404).json({ message: "Booking not found." });

    if (String(row.booking_status) !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be rejected." });
    }

    await db.query(
      `UPDATE bookings SET booking_status = 'Cancelled' WHERE id = ? AND agency_id = ?`,
      [bookingId, agencyId]
    );

    return res.json({ message: "Booking rejected." });
  } catch (err) {
    console.error("rejectAgencyBookingController error", err);
    return res.status(500).json({ message: "Failed to reject booking." });
  }
}