// server/models/agencyEarningsModel.js
import { db } from "../db.js";

function buildPaymentId(bookingId, paidAt, createdAt) {
  const sourceDate = paidAt || createdAt || new Date();
  const year = new Date(sourceDate).getFullYear();

  return `PMT-${year}-${String(bookingId).padStart(4, "0")}`;
}

export async function getAgencyEarnings({
  agencyId,
  search = "",
  sort = "newest",
  page = 1,
  limit = 30,
}) {
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : 30;
  const offset = (pageNum - 1) * limitNum;

  const normalizedSort =
    String(sort || "").trim().toLowerCase() === "oldest" ? "oldest" : "newest";

  const whereParts = [
    "b.agency_id = ?",
    "b.booking_status <> 'Cancelled'",
    "b.payment_status = 'Paid'",
  ];
  const params = [agencyId];

  if (search && String(search).trim()) {
    const s = `%${String(search).trim()}%`;
    const compactSearch = String(search).trim().replace(/\s+/g, "");

    whereParts.push(
      `(
        u.name LIKE ?
        OR t.title LIKE ?
        OR b.ref_code LIKE ?
        OR CONCAT(
          'PMT-',
          YEAR(COALESCE(b.paid_at, b.created_at)),
          '-',
          LPAD(b.id, 4, '0')
        ) LIKE ?
      )`
    );

    params.push(s, s, s, `%${compactSearch}%`);
  }

  const whereClause = `WHERE ${whereParts.join(" AND ")}`;

  let orderBy = "ORDER BY COALESCE(b.paid_at, b.created_at) DESC, b.id DESC";
  if (normalizedSort === "oldest") {
    orderBy = "ORDER BY COALESCE(b.paid_at, b.created_at) ASC, b.id ASC";
  }

  const [rows] = await db.query(
    `SELECT
        b.id AS booking_id,
        b.ref_code,
        b.total_price,
        b.paid_at,
        b.created_at,
        COALESCE(NULLIF(TRIM(u.name), ''), 'Tourist') AS tourist_name,
        t.title AS tour_name
     FROM bookings b
     INNER JOIN users u ON u.id = b.user_id
     INNER JOIN tours t ON t.id = b.tour_id
     ${whereClause}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const [[summary]] = await db.query(
    `SELECT
        COUNT(*) AS totalTransactions,
        COALESCE(SUM(b.total_price), 0) AS totalAmount
     FROM bookings b
     INNER JOIN users u ON u.id = b.user_id
     INNER JOIN tours t ON t.id = b.tour_id
     ${whereClause}`,
    params
  );

  const transactions = rows.map((row) => ({
    payment_id: buildPaymentId(row.booking_id, row.paid_at, row.created_at),
    tourist_name: row.tourist_name,
    tour_name: row.tour_name,
    amount: Number(row.total_price || 0),
    status: "Paid",
  }));

  return {
    transactions,
    summary: {
      totalTransactions: Number(summary?.totalTransactions || 0),
      totalAmount: Number(summary?.totalAmount || 0),
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      hasMore:
        offset + transactions.length < Number(summary?.totalTransactions || 0),
    },
  };
}