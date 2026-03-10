// server/models/adminDashboardModel.js
import { db } from "../db.js";

export async function getAdminDashboardStats() {
  const [[touristsRow]] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'tourist'
    `
  );

  const [[agenciesRow]] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM agencies
    `
  );

  const [[bookingsRow]] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM bookings
    `
  );

  const [[paymentsRow]] = await db.query(
    `
      SELECT COALESCE(SUM(total_price), 0) AS total
      FROM bookings
      WHERE payment_status = 'Paid'
    `
  );

  const [[activeToursRow]] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM agency_tours
      WHERE listing_status = 'active'
    `
  );

  return {
    totalTourists: Number(touristsRow?.total || 0),
    totalAgencies: Number(agenciesRow?.total || 0),
    totalBookings: Number(bookingsRow?.total || 0),
    totalPayments: Number(paymentsRow?.total || 0),
    activeTours: Number(activeToursRow?.total || 0),
  };
}

export async function getPopularToursLast30Days() {
  const [rows] = await db.query(
    `
      SELECT
        t.title AS name,
        COUNT(b.id) AS booking_count
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND b.booking_status <> 'Cancelled'
      GROUP BY b.tour_id, t.title
      ORDER BY booking_count DESC, t.title ASC
      LIMIT 5
    `
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    value: `${Number(row.booking_count || 0).toLocaleString("en-IN")} bookings`,
  }));
}

export async function getTopRatedAgencies() {
  const [rows] = await db.query(
    `
      SELECT
        a.name AS name,
        AVG(r.rating) AS avg_rating
      FROM reviews r
      INNER JOIN agencies a ON a.id = r.agency_id
      GROUP BY r.agency_id, a.name
      ORDER BY avg_rating DESC, a.name ASC
      LIMIT 5
    `
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    value: Number(row.avg_rating || 0).toFixed(1),
  }));
}

export async function getLatestBookingStatusActivity() {
  const [rows] = await db.query(
    `
      SELECT
        b.id,
        b.ref_code,
        b.travelers,
        b.total_price,
        b.booking_status,
        b.payment_status,
        b.created_at,
        b.paid_at,
        t.title AS tour_title
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      ORDER BY
        GREATEST(
          COALESCE(b.paid_at, '1970-01-01'),
          COALESCE(b.created_at, '1970-01-01')
        ) DESC
      LIMIT 12
    `
  );

  const activity = [];

  for (const row of rows) {
    const reference = row.ref_code ? `#${row.ref_code}` : `#BK-${row.id}`;
    const details = `${row.tour_title} — ${Number(row.travelers || 0)} pax`;
    const amount = Number(row.total_price || 0);

    if (row.booking_status === "Cancelled") {
      activity.push({
        type: "Cancelled",
        reference,
        details,
        time: row.created_at,
        amount,
      });
      continue;
    }

    if (row.payment_status === "Paid" && row.paid_at) {
      activity.push({
        type: "Paid",
        reference,
        details,
        time: row.paid_at,
        amount,
      });
      continue;
    }

    if (row.booking_status === "Approved" || row.booking_status === "Confirmed") {
      activity.push({
        type: "Approved",
        reference,
        details,
        time: row.created_at,
        amount,
      });
      continue;
    }

    if (row.booking_status === "Pending") {
      activity.push({
        type: "Pending",
        reference,
        details,
        time: row.created_at,
        amount,
      });
    }
  }

  return activity;
}