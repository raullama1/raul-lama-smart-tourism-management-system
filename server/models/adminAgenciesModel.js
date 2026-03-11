// server/models/adminAgenciesModel.js
import { db } from "../db.js";

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

export async function getAdminAgenciesModel({
  q = "",
  status = "all",
  sort = "newest",
}) {
  const conditions = [`1 = 1`];
  const params = [];

  const trimmedQ = String(q || "").trim();
  const normalizedStatus = String(status || "all").trim().toLowerCase();
  const normalizedSort = String(sort || "newest").trim().toLowerCase();

  if (trimmedQ) {
    conditions.push(`(a.name LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)`);
    params.push(`%${trimmedQ}%`, `%${trimmedQ}%`, `%${trimmedQ}%`);
  }

  if (normalizedStatus === "active") {
    conditions.push(`COALESCE(a.is_blocked, 0) = 0`);
  } else if (normalizedStatus === "blocked") {
    conditions.push(`COALESCE(a.is_blocked, 0) = 1`);
  }

  let orderBy = `a.created_at DESC, a.id DESC`;
  if (normalizedSort === "oldest") {
    orderBy = `a.created_at ASC, a.id ASC`;
  }

  const [rows] = await db.query(
    `
      SELECT
        a.id,
        a.name,
        a.email,
        a.phone,
        a.created_at,
        COALESCE(a.is_blocked, 0) AS is_blocked,
        COUNT(DISTINCT at.id) AS total_tours,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT bl.id) AS total_blogs,
        COUNT(DISTINCT r.id) AS total_reviews
      FROM agencies a
      LEFT JOIN agency_tours at ON at.agency_id = a.id
      LEFT JOIN bookings b ON b.agency_id = a.id
      LEFT JOIN blogs bl ON bl.agency_id = a.id
      LEFT JOIN reviews r ON r.agency_id = a.id
      WHERE ${conditions.join(" AND ")}
      GROUP BY a.id, a.name, a.email, a.phone, a.created_at, a.is_blocked
      ORDER BY ${orderBy}
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    is_blocked: Number(row.is_blocked) === 1,
    created_at: formatDateOnly(row.created_at),
    total_tours: Number(row.total_tours || 0),
    total_bookings: Number(row.total_bookings || 0),
    total_blogs: Number(row.total_blogs || 0),
    total_reviews: Number(row.total_reviews || 0),
  }));
}

export async function getAdminAgencyByIdModel(agencyId) {
  const [rows] = await db.query(
    `
      SELECT
        a.id,
        a.name,
        a.email,
        a.phone,
        a.address,
        a.pan_vat,
        a.created_at,
        COALESCE(a.is_blocked, 0) AS is_blocked,
        COUNT(DISTINCT at.id) AS total_tours,
        COUNT(DISTINCT bl.id) AS total_blogs,
        COUNT(DISTINCT r.id) AS total_reviews,
        COALESCE(SUM(CASE WHEN b.payment_status = 'Paid' THEN b.total_price ELSE 0 END), 0) AS total_earnings
      FROM agencies a
      LEFT JOIN agency_tours at ON at.agency_id = a.id
      LEFT JOIN blogs bl ON bl.agency_id = a.id
      LEFT JOIN reviews r ON r.agency_id = a.id
      LEFT JOIN bookings b ON b.agency_id = a.id
      WHERE a.id = ?
      GROUP BY
        a.id, a.name, a.email, a.phone, a.address, a.pan_vat, a.created_at, a.is_blocked
      LIMIT 1
    `,
    [agencyId]
  );

  const row = rows[0];
  if (!row) return null;

  const [tourRows] = await db.query(
    `
      SELECT
        at.id,
        at.price,
        at.listing_status,
        at.created_at,
        t.title AS tour_title,
        t.location
      FROM agency_tours at
      INNER JOIN tours t ON t.id = at.tour_id
      WHERE at.agency_id = ?
      ORDER BY at.created_at DESC, at.id DESC
    `,
    [agencyId]
  );

  const [blogRows] = await db.query(
    `
      SELECT
        id,
        title,
        type,
        created_at
      FROM blogs
      WHERE agency_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [agencyId]
  );

  return {
    ...row,
    is_blocked: Number(row.is_blocked) === 1,
    created_at: formatDateOnly(row.created_at),
    total_tours: Number(row.total_tours || 0),
    total_blogs: Number(row.total_blogs || 0),
    total_reviews: Number(row.total_reviews || 0),
    total_earnings: Number(row.total_earnings || 0),
    tours: tourRows.map((tour) => ({
      id: tour.id,
      tour_title: tour.tour_title,
      location: tour.location,
      price: Number(tour.price || 0),
      listing_status: tour.listing_status,
      created_at: formatDateOnly(tour.created_at),
    })),
    blogs: blogRows.map((blog) => ({
      id: blog.id,
      title: blog.title,
      type: blog.type,
      created_at: formatDateOnly(blog.created_at),
    })),
  };
}

export async function updateAdminAgencyBlockedStatusModel(agencyId, isBlocked) {
  const [result] = await db.query(
    `
      UPDATE agencies
      SET is_blocked = ?
      WHERE id = ?
      LIMIT 1
    `,
    [isBlocked ? 1 : 0, agencyId]
  );

  return result;
}