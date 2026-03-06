// server/models/blogModel.js
import { db } from "../db.js";

function toMySqlDateTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export async function getLatestBlogs(limit = 4, excludeId = null) {
  const params = [];
  let whereClause = "";

  if (excludeId) {
    whereClause = "WHERE id <> ?";
    params.push(excludeId);
  }

  params.push(Number(limit));

  const [rows] = await db.query(
    `SELECT 
        id,
        title,
        excerpt,
        content,
        agency_name,
        type,
        image_url,
        created_at
     FROM blogs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ?`,
    params
  );

  return rows;
}

export async function getSmartRecentBlogs({
  limit = 12,
  excludeId = null,
  daysWindow = 7,
} = {}) {
  const lim = Math.max(1, Number(limit) || 12);
  const days = Math.max(1, Number(daysWindow) || 7);

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const cutoffSql = toMySqlDateTime(cutoff);

  const recentParams = [];
  const recentWhere = [];

  if (excludeId) {
    recentWhere.push("id <> ?");
    recentParams.push(excludeId);
  }

  recentWhere.push("created_at >= ?");
  recentParams.push(cutoffSql);

  const recentWhereClause = recentWhere.length
    ? `WHERE ${recentWhere.join(" AND ")}`
    : "";

  const [recentRows] = await db.query(
    `SELECT
        id,
        title,
        excerpt,
        content,
        agency_name,
        type,
        image_url,
        created_at
     FROM blogs
     ${recentWhereClause}
     ORDER BY created_at DESC
     LIMIT ?`,
    [...recentParams, lim]
  );

  if (recentRows.length >= lim) return recentRows;

  const remaining = lim - recentRows.length;
  const pickedIds = recentRows.map((r) => r.id);

  const olderParams = [];
  const olderWhere = [];

  if (excludeId) {
    olderWhere.push("id <> ?");
    olderParams.push(excludeId);
  }

  if (pickedIds.length > 0) {
    olderWhere.push(`id NOT IN (${pickedIds.map(() => "?").join(",")})`);
    olderParams.push(...pickedIds);
  }

  olderWhere.push("created_at < ?");
  olderParams.push(cutoffSql);

  const olderWhereClause = olderWhere.length
    ? `WHERE ${olderWhere.join(" AND ")}`
    : "";

  const [olderRows] = await db.query(
    `SELECT
        id,
        title,
        excerpt,
        content,
        agency_name,
        type,
        image_url,
        created_at
     FROM blogs
     ${olderWhereClause}
     ORDER BY created_at DESC
     LIMIT ?`,
    [...olderParams, remaining]
  );

  return [...recentRows, ...olderRows];
}

export async function getPublicBlogs(filters) {
  const { search = "", sort = "latest", page = 1, limit = 6 } = filters;

  const whereParts = [];
  const params = [];

  if (search) {
    whereParts.push(
      "(b.title LIKE ? OR b.excerpt LIKE ? OR b.content LIKE ? OR b.agency_name LIKE ? OR b.type LIKE ?)"
    );
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  const whereClause = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  let orderBy = "ORDER BY b.created_at DESC";

  if (sort === "latest") {
    orderBy = "ORDER BY b.created_at DESC";
  } else if (sort === "oldest") {
    orderBy = "ORDER BY b.created_at ASC";
  } else if (sort === "top-agencies") {
    orderBy = `
      ORDER BY
        COALESCE(agency_stats.confirmed_bookings_count, 0) DESC,
        b.created_at DESC
    `;
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `SELECT
        b.id,
        b.title,
        b.excerpt,
        b.content,
        b.agency_name,
        b.type,
        b.image_url,
        b.created_at,
        COALESCE(agency_stats.confirmed_bookings_count, 0) AS confirmed_bookings_count
     FROM blogs b
     LEFT JOIN (
       SELECT
         agency_id,
         COUNT(*) AS confirmed_bookings_count
       FROM bookings
       WHERE booking_status = 'Confirmed'
       GROUP BY agency_id
     ) AS agency_stats
       ON agency_stats.agency_id = b.agency_id
     ${whereClause}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM blogs b
     ${whereClause}`,
    params
  );

  return {
    data: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: offset + rows.length < total,
    },
  };
}

export async function getPublicBlogById(blogId) {
  const [rows] = await db.query(
    `SELECT 
        id,
        title,
        excerpt,
        content,
        agency_name,
        type,
        image_url,
        created_at
     FROM blogs
     WHERE id = ?`,
    [blogId]
  );

  return rows[0] || null;
}
