// server/models/adminReviewsModel.js
import { db } from "../db.js";

export async function getAllAdminReviews(filters = {}) {
  const { q = "", rating = "All", sort = "newest" } = filters;

  const where = ["1=1"];
  const params = [];

  if (q) {
    where.push(
      "(u.name LIKE ? OR t.title LIKE ? OR a.name LIKE ? OR r.comment LIKE ?)"
    );
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (rating !== "All") {
    where.push("r.rating = ?");
    params.push(Number(rating));
  }

  const orderBy =
    String(sort || "").toLowerCase() === "oldest"
      ? "ORDER BY r.created_at ASC"
      : "ORDER BY r.created_at DESC";

  const [rows] = await db.query(
    `
    SELECT
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.id AS tourist_id,
      u.name AS tourist_name,
      u.profile_image AS tourist_profile_image,
      t.title AS tour_title,
      a.name AS agency_name
    FROM reviews r
    INNER JOIN users u ON u.id = r.user_id
    INNER JOIN tours t ON t.id = r.tour_id
    INNER JOIN agencies a ON a.id = r.agency_id
    WHERE ${where.join(" AND ")}
    ${orderBy}
    `,
    params
  );

  return rows;
}

export async function deleteAdminReviewById(reviewId) {
  const [res] = await db.query(`DELETE FROM reviews WHERE id = ?`, [
    Number(reviewId),
  ]);

  return res.affectedRows > 0;
}