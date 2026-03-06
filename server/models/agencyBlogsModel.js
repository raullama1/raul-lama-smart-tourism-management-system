// server/models/agencyBlogsModel.js
import { db } from "../db.js";

function buildExcerpt(content, max = 255) {
  const clean = String(content || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
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

  const [agencyRows] = await db.query(
    `SELECT id, name
     FROM agencies
     WHERE id = ?
     LIMIT 1`,
    [agencyId]
  );

  const agency = agencyRows[0];
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
  };
}