// server/controllers/agencyDashboardController.js
import { db } from "../db.js";

export async function getAgencyDashboardController(req, res) {
  try {
    const agencyId = req.user?.id;
    const role = req.user?.role;

    if (!agencyId || role !== "agency") {
      return res.status(401).json({ message: "Agency authentication required." });
    }

    // Active Tours = distinct tours booked by this agency (works with current DB)
    const [[activeToursRow]] = await db.query(
      `SELECT COUNT(DISTINCT tour_id) AS cnt
       FROM bookings
       WHERE agency_id = ?
         AND booking_status <> 'Cancelled'`,
      [agencyId]
    );

    const [[bookingsRow]] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM bookings
       WHERE agency_id = ?`,
      [agencyId]
    );

    const [[pendingRow]] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM bookings
       WHERE agency_id = ?
         AND booking_status = 'Pending'`,
      [agencyId]
    );

    const [[earningsRow]] = await db.query(
      `SELECT COALESCE(SUM(total_price), 0) AS sum
       FROM bookings
       WHERE agency_id = ?
         AND payment_status = 'Paid'`,
      [agencyId]
    );

    const [recentBookingsRows] = await db.query(
      `SELECT
          b.id,
          b.travelers,
          b.booking_status,
          b.payment_status,
          b.created_at,
          b.booking_date,
          u.name AS user_name,
          t.title AS tour_title
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN tours t ON t.id = b.tour_id
       WHERE b.agency_id = ?
       ORDER BY b.created_at DESC
       LIMIT 4`,
      [agencyId]
    );

    const recentBookings = recentBookingsRows.map((r) => ({
      id: r.id,
      tour_title: r.tour_title,
      travelers: r.travelers,
      user_name: r.user_name,
      booking_status: r.booking_status,
      payment_status: r.payment_status,
      booking_date_label: r.booking_date
        ? new Date(r.booking_date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })
        : "—",
      payment_label: r.payment_status === "Paid" ? "Paid (NPR)" : "Unpaid",
    }));

    const [recentReviewsRows] = await db.query(
      `SELECT
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          u.name AS user_name,
          t.title AS tour_title
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN tours t ON t.id = r.tour_id
       WHERE r.agency_id = ?
       ORDER BY r.created_at DESC
       LIMIT 4`,
      [agencyId]
    );

    const recentReviews = recentReviewsRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      user_name: r.user_name,
      tour_title: r.tour_title,
    }));

    return res.json({
      stats: {
        activeTours: Number(activeToursRow?.cnt || 0),
        bookings: Number(bookingsRow?.cnt || 0),
        pendingRequests: Number(pendingRow?.cnt || 0),
        earningsNpr: Number(earningsRow?.sum || 0),
      },
      recentBookings,
      recentReviews,
    });
  } catch (err) {
    console.error("getAgencyDashboardController error", err);
    return res.status(500).json({ message: "Failed to load agency dashboard." });
  }
}
