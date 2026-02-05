import {
  getUserBookings,
  markBookingPaid,
  cancelBooking,
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
