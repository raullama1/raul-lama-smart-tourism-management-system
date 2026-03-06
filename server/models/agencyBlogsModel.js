// server/models/agencyBlogsModel.js
import { db } from "../db.js";

function buildExcerpt(content, max = 255) {
  const clean = String(content || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

async function getAgencyNameById(agencyId) {
  const [agencyRows] = await db.query(
    `SELECT id, name
     FROM agencies
     WHERE id = ?
     LIMIT 1`,
    [agencyId]
  );

  return agencyRows[0] || null;
}

export async function createAgencyBlog({
  agencyId,
  title,
  type,
  content,
  imageUrl,
}) {
  const cleanTitle = String(title || "").trim();
  const cleanType = String(type || "").trim();
  const cleanContent = String(content || "").trim();
  const excerpt = buildExcerpt(cleanContent, 255);

  const agency = await getAgencyNameById(agencyId);
  if (!agency) {
    throw new Error("Agency not found.");
  }

  const [result] = await db.query(
    `INSERT INTO blogs
      (title, excerpt, content, agency_id, agency_name, type, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      cleanTitle,
      excerpt,
      cleanContent,
      agency.id,
      agency.name,
      cleanType,
      imageUrl,
    ]
  );

  return {
    id: result.insertId,
    title: cleanTitle,
    excerpt,
    content: cleanContent,
    agency_id: agency.id,
    agency_name: agency.name,
    type: cleanType,
    image_url: imageUrl,
    comment_count: 0,
  };
}

export async function getAgencyBlogs({
  agencyId,
  search = "",
  sort = "newest",
  page = 1,
  limit = 50,
}) {
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : 50;
  const offset = (pageNum - 1) * limitNum;

  const normalizedSort =
    String(sort || "").trim().toLowerCase() === "oldest" ? "oldest" : "newest";

  const whereParts = ["b.agency_id = ?"];
  const params = [agencyId];

  if (search && String(search).trim()) {
    const s = `%${String(search).trim()}%`;
    whereParts.push(
      "(b.title LIKE ? OR b.excerpt LIKE ? OR b.content LIKE ? OR b.type LIKE ?)"
    );
    params.push(s, s, s, s);
  }

  const whereClause = `WHERE ${whereParts.join(" AND ")}`;

  let orderBy = "ORDER BY b.created_at DESC, b.id DESC";
  if (normalizedSort === "oldest") {
    orderBy = "ORDER BY b.created_at ASC, b.id ASC";
  }

  const [rows] = await db.query(
    `SELECT
        b.id,
        b.title,
        b.excerpt,
        b.content,
        b.agency_id,
        b.agency_name,
        b.type,
        b.image_url,
        b.created_at,
        COUNT(bc.id) AS comment_count
     FROM blogs b
     LEFT JOIN blog_comments bc ON bc.blog_id = b.id
     ${whereClause}
     GROUP BY
        b.id,
        b.title,
        b.excerpt,
        b.content,
        b.agency_id,
        b.agency_name,
        b.type,
        b.image_url,
        b.created_at
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

  const [[summary]] = await db.query(
    `SELECT
        COUNT(DISTINCT b.id) AS totalBlogs,
        COUNT(bc.id) AS totalComments
     FROM blogs b
     LEFT JOIN blog_comments bc ON bc.blog_id = b.id
     WHERE b.agency_id = ?`,
    [agencyId]
  );

  return {
    blogs: rows.map((row) => ({
      ...row,
      comment_count: Number(row.comment_count || 0),
    })),
    pagination: {
      total: Number(total || 0),
      page: pageNum,
      limit: limitNum,
      hasMore: offset + rows.length < Number(total || 0),
    },
    summary: {
      totalBlogs: Number(summary?.totalBlogs || 0),
      totalComments: Number(summary?.totalComments || 0),
    },
  };
}

export async function getAgencyBlogById({ agencyId, blogId }) {
  const [rows] = await db.query(
    `SELECT
        b.id,
        b.title,
        b.excerpt,
        b.content,
        b.agency_id,
        b.agency_name,
        b.type,
        b.image_url,
        b.created_at,
        COUNT(bc.id) AS comment_count
     FROM blogs b
     LEFT JOIN blog_comments bc ON bc.blog_id = b.id
     WHERE b.id = ? AND b.agency_id = ?
     GROUP BY
        b.id,
        b.title,
        b.excerpt,
        b.content,
        b.agency_id,
        b.agency_name,
        b.type,
        b.image_url,
        b.created_at
     LIMIT 1`,
    [blogId, agencyId]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    comment_count: Number(rows[0].comment_count || 0),
  };
}

export async function updateAgencyBlog({
  agencyId,
  blogId,
  title,
  type,
  content,
  imageUrl,
}) {
  const cleanTitle = String(title || "").trim();
  const cleanType = String(type || "").trim();
  const cleanContent = String(content || "").trim();
  const excerpt = buildExcerpt(cleanContent, 255);

  const existing = await getAgencyBlogById({ agencyId, blogId });
  if (!existing) {
    return null;
  }

  const finalImageUrl = imageUrl || existing.image_url || "";

  await db.query(
    `UPDATE blogs
     SET
       title = ?,
       excerpt = ?,
       content = ?,
       type = ?,
       image_url = ?
     WHERE id = ? AND agency_id = ?`,
    [
      cleanTitle,
      excerpt,
      cleanContent,
      cleanType,
      finalImageUrl,
      blogId,
      agencyId,
    ]
  );

  return getAgencyBlogById({ agencyId, blogId });
}

export async function deleteAgencyBlog({ agencyId, blogId }) {
  const [result] = await db.query(
    `DELETE FROM blogs
     WHERE id = ? AND agency_id = ?`,
    [blogId, agencyId]
  );

  return result.affectedRows > 0;
}