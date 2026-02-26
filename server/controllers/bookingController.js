// server/controllers/bookingController.js
import {
  getUserBookings,
  markBookingPaid,
  cancelBooking,
  fetchBookingPreviewByAgencyTourId,
  insertBooking,
} from "../models/bookingModel.js";

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

    // Active-only preview is enforced in model
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

    res.status(201).json({ message: "Booking created.", data: created });
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Failed to create booking." });
  }
}