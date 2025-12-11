// server/models/blogModel.js
import { db } from "../db.js";

// --------------------------------------------------
// Latest blogs for Home Page + Recent blogs sections
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
// Public blogs list for Blogs Page (Screen 4)
// with search, sort, pagination
// --------------------------------------------------
export async function getPublicBlogs(filters) {
  const {
    search = "",
    sort = "", // "" | "latest" | "top-agencies"
    page = 1,
    limit = 6,
  } = filters;

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

  // sort logic
  let orderBy = "ORDER BY created_at DESC"; // default: latest
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
// Single blog for Blog Details Page (Screen 5)
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
