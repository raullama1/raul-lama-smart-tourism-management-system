// server/models/adminReportsModel.js
import { db } from "../db.js";

function toNumber(value) {
  return Number(value || 0);
}

function calcGrowth(current, previous) {
  const curr = toNumber(current);
  const prev = toNumber(previous);

  if (prev <= 0) {
    return curr > 0 ? 100 : 0;
  }

  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

export async function getAdminReportsModel() {
  const [
    [bookingRows],
    [touristRows],
    [agencyRows],
    [paymentRows],
    [topToursRows],
    [blockedUserRows],
    [blockedAgencyRows],
    [ratingRows],
    [paymentsOverTimeRows],
  ] = await Promise.all([
    db.query(`
      SELECT COUNT(*) AS count
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL 30 DAY
    `),

    db.query(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'tourist'
    `),

    db.query(`
      SELECT COUNT(*) AS count
      FROM agencies
      WHERE COALESCE(is_blocked, 0) = 0
    `),

    db.query(`
      SELECT COALESCE(SUM(total_price), 0) AS total
      FROM bookings
      WHERE payment_status = 'Paid'
    `),

    db.query(`
      SELECT
        t.title,
        COUNT(b.id) AS bookings
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      GROUP BY t.id, t.title
      ORDER BY bookings DESC, t.title ASC
      LIMIT 20
    `),

    db.query(`
      SELECT
        name,
        'Tourist' AS type
      FROM users
      WHERE role = 'tourist'
        AND COALESCE(is_blocked, 0) = 1
      ORDER BY name ASC
      LIMIT 20
    `),

    db.query(`
      SELECT
        name,
        'Agency' AS type
      FROM agencies
      WHERE COALESCE(is_blocked, 0) = 1
      ORDER BY name ASC
      LIMIT 20
    `),

    db.query(`
      SELECT
        a.name,
        ROUND(AVG(r.rating), 1) AS rating,
        COUNT(r.id) AS total_reviews
      FROM reviews r
      INNER JOIN agencies a ON a.id = r.agency_id
      GROUP BY a.id, a.name
      HAVING COUNT(r.id) > 0
      ORDER BY rating DESC, total_reviews DESC, a.name ASC
      LIMIT 20
    `),

    db.query(`
      SELECT
        YEAR(paid_at) AS year_value,
        MONTH(paid_at) AS month_value,
        DATE_FORMAT(paid_at, '%b %Y') AS month_label,
        COALESCE(SUM(total_price), 0) AS amount
      FROM bookings
      WHERE payment_status = 'Paid'
        AND paid_at IS NOT NULL
      GROUP BY YEAR(paid_at), MONTH(paid_at), DATE_FORMAT(paid_at, '%b %Y')
      ORDER BY YEAR(paid_at) DESC, MONTH(paid_at) DESC
      LIMIT 20
    `),
  ]);

  const blocked = [...blockedUserRows, ...blockedAgencyRows];

  const paymentHistory = paymentsOverTimeRows.map((row, index, arr) => {
    const previous = arr[index + 1];
    const growth = calcGrowth(row.amount, previous?.amount || 0);

    return {
      month: row.month_label,
      amount: toNumber(row.amount),
      growth,
    };
  });

  return {
    summary: {
      bookings: toNumber(bookingRows[0]?.count),
      tourists: toNumber(touristRows[0]?.count),
      agencies: toNumber(agencyRows[0]?.count),
      payments: toNumber(paymentRows[0]?.total),
    },

    topTours: topToursRows.map((row) => ({
      title: row.title,
      bookings: toNumber(row.bookings),
    })),

    blocked: blocked.map((row) => ({
      name: row.name,
      type: row.type,
    })),

    ratings: ratingRows.map((row) => ({
      name: row.name,
      rating: Number(row.rating || 0),
      total_reviews: toNumber(row.total_reviews),
    })),

    paymentsOverTime: paymentHistory,
  };
}