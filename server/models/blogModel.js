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

// --------------------------------------------------
// Latest blogs for Home Page + simple latest sections
// --------------------------------------------------
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
        agency_name,
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

// --------------------------------------------------
// Smart Recent Blogs:
// 1) Try last N days first (latest-first)
// 2) If not enough, fill from older posts (latest-first)
// 3) Exclude current blog
// --------------------------------------------------
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
        image_url,
        created_at
     FROM blogs
     ${recentWhereClause}
     ORDER BY created_at DESC
     LIMIT ?`,
    [...recentParams, lim]
  );

  if (recentRows.length >= lim) return recentRows;

  // Fill remaining from older (still latest-first), excluding already picked ids
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

// --------------------------------------------------
// Public blogs list for Blogs Page
// with search, sort, pagination
// --------------------------------------------------
export async function getPublicBlogs(filters) {
  const { search = "", sort = "", page = 1, limit = 6 } = filters;

  const whereParts = [];
  const params = [];

  if (search) {
    whereParts.push(
      "(title LIKE ? OR excerpt LIKE ? OR content LIKE ? OR agency_name LIKE ?)"
    );
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  const whereClause = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  let orderBy = "ORDER BY created_at DESC";
  if (sort === "latest") {
    orderBy = "ORDER BY created_at DESC";
  } else if (sort === "top-agencies") {
    orderBy = "ORDER BY agency_name ASC, created_at DESC";
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `SELECT 
        id,
        title,
        excerpt,
        content,
        agency_name,
        image_url,
        created_at
     FROM blogs
     ${whereClause}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM blogs
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

// --------------------------------------------------
// Single blog for Blog Details Page
// --------------------------------------------------
export async function getPublicBlogById(blogId) {
  const [rows] = await db.query(
    `SELECT 
        id,
        title,
        excerpt,
        content,
        agency_name,
        image_url,
        created_at
     FROM blogs
     WHERE id = ?`,
    [blogId]
  );

  return rows[0] || null;
}
