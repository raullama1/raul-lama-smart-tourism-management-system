// server/controllers/adminDashboardController.js
import {
  getAdminDashboardStats,
  getLatestBookingStatusActivity,
  getPopularToursLast30Days,
  getTopRatedAgencies,
} from "../models/adminDashboardModel.js";

function formatTimeAgo(input) {
  const date = new Date(input);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export async function getAdminDashboardController(req, res) {
  try {
    if (!req.user?.id || req.user?.role !== "admin") {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const [stats, popularTours, topRatedAgencies, bookingStatusActivity] =
      await Promise.all([
        getAdminDashboardStats(),
        getPopularToursLast30Days(),
        getTopRatedAgencies(),
        getLatestBookingStatusActivity(),
      ]);

    const latestActivity = bookingStatusActivity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6)
      .map((item) => ({
        ...item,
        time: formatTimeAgo(item.time),
      }));

    return res.json({
      stats,
      popularTours,
      topRatedAgencies,
      latestActivity,
    });
  } catch (err) {
    console.error("getAdminDashboardController error", err);
    return res.status(500).json({ message: "Failed to load admin dashboard." });
  }
}