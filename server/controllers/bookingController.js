// server/controllers/bookingController.js
import { db } from "../db.js";
import {
  getUserBookings,
  markBookingPaid,
  cancelBooking,
  fetchBookingPreviewByAgencyTourId,
  insertBooking,
} from "../models/bookingModel.js";
import { createNotification } from "../models/notificationModel.js";

function emitNotification(io, role, userId, notification) {
  if (!io || !notification || !role || !userId) return;
  io.to(`acct:${role}:${Number(userId)}`).emit("notification:new", notification);
  io.to(`acct:${role}:${Number(userId)}`).emit("notification:refresh");
}

export async function listMyBookings(req, res) {
  try {
    const userId = req.user.id;
    const { q = "", status = "All", date = "All" } = req.query;

    const rows = await getUserBookings(userId, { q, status, date });
    res.json({ data: rows });
  } catch (err) {
    console.error("listMyBookings error:", err);
    res.status(500).json({ message: "Failed to load bookings." });
  }
}

export async function payBooking(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const ok = await markBookingPaid(userId, bookingId);
    if (!ok) return res.status(400).json({ message: "Payment update failed." });

    res.json({ message: "Payment marked as paid." });
  } catch (err) {
    console.error("payBooking error:", err);
    res.status(500).json({ message: "Failed to update payment." });
  }
}

export async function cancelMyBooking(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const ok = await cancelBooking(userId, bookingId);
    if (!ok) return res.status(400).json({ message: "Cancel failed." });

    const [[booking]] = await db.query(
      `
      SELECT
        b.id,
        b.ref_code,
        b.agency_id,
        b.tour_id,
        t.title AS tour_title
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      WHERE b.id = ? AND b.user_id = ?
      LIMIT 1
      `,
      [Number(bookingId), Number(userId)]
    );

    if (booking) {
      const io = req.app.get("io");

      const agencyNotification = await createNotification({
        userId: Number(booking.agency_id),
        receiverRole: "agency",
        type: "booking_cancelled",
        title: "Booking cancelled",
        message: `A tourist cancelled booking ${booking.ref_code} for ${booking.tour_title}.`,
        actionPath: `/agency/bookings`,
        actionLabel: "View bookings",
        meta: {
          bookingId: Number(booking.id),
          refCode: booking.ref_code,
        },
      });

      emitNotification(io, "agency", booking.agency_id, agencyNotification);
    }

    res.json({ message: "Booking cancelled." });
  } catch (err) {
    console.error("cancelMyBooking error:", err);
    res.status(500).json({ message: "Failed to cancel booking." });
  }
}

export async function getBookingPreview(req, res) {
  try {
    const { agencyTourId } = req.params;

    if (!agencyTourId) {
      return res.status(400).json({ message: "agencyTourId is required." });
    }

    const preview = await fetchBookingPreviewByAgencyTourId(Number(agencyTourId));
    if (!preview) {
      return res.status(404).json({ message: "Booking preview not found (inactive or missing)." });
    }

    res.json({ data: preview });
  } catch (err) {
    console.error("getBookingPreview error:", err);
    res.status(500).json({ message: "Failed to load booking preview." });
  }
}

export async function createBooking(req, res) {
  try {
    const userId = req.user.id;
    const { agencyTourId, travelers, notes, selectedDateLabel } = req.body;

    if (!agencyTourId) {
      return res.status(400).json({ message: "agencyTourId is required." });
    }

    if (!selectedDateLabel) {
      return res.status(400).json({ message: "selectedDateLabel is required." });
    }

    const trav = Number(travelers || 1);
    if (Number.isNaN(trav) || trav < 1 || trav > 99) {
      return res.status(400).json({ message: "travelers must be between 1 and 99." });
    }

    const created = await insertBooking({
      userId,
      agencyTourId: Number(agencyTourId),
      travelers: trav,
      notes: notes || null,
      selectedDateLabel: String(selectedDateLabel || "").trim(),
    });

    if (!created) {
      return res.status(400).json({
        message: "Booking failed. The listing may be inactive or the selected date is invalid.",
      });
    }

    const [[booking]] = await db.query(
      `
      SELECT
        b.id,
        b.ref_code,
        b.agency_id,
        t.title AS tour_title,
        u.name AS tourist_name
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      INNER JOIN users u ON u.id = b.user_id
      WHERE b.id = ?
      LIMIT 1
      `,
      [Number(created.id)]
    );

    if (booking) {
      const io = req.app.get("io");

      const agencyNotification = await createNotification({
        userId: Number(booking.agency_id),
        receiverRole: "agency",
        type: "new_booking",
        title: "New booking received",
        message: `${booking.tourist_name} booked ${booking.tour_title}.`,
        actionPath: `/agency/bookings`,
        actionLabel: "View bookings",
        meta: {
          bookingId: Number(booking.id),
          refCode: booking.ref_code,
        },
      });

      emitNotification(io, "agency", booking.agency_id, agencyNotification);
    }

    res.status(201).json({ message: "Booking created.", data: created });
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Failed to create booking." });
  }
}