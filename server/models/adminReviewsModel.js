// server/models/adminReviewsModel.js
import { db } from "../db.js";

export async function getAgencyReviews(agencyId, filters = {}) {
  const {
    search = "",
    sort = "newest",
    rating = "any",
  } = filters;

  const where = ["r.agency_id = ?"];
  const params = [agencyId];

  if (search) {
    where.push(
      "(u.name LIKE ? OR t.title LIKE ? OR r.comment LIKE ?)"
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (
    String(rating).toLowerCase() !== "any" &&
    String(rating).toLowerCase() !== "all"
  ) {
    where.push("r.rating = ?");
    params.push(Number(rating));
  }

  const orderBy =
    String(sort).toLowerCase() === "oldest"
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
      t.title AS tour_name
    FROM reviews r
    INNER JOIN users u ON u.id = r.user_id
    INNER JOIN tours t ON t.id = r.tour_id
    WHERE ${where.join(" AND ")}
    ${orderBy}
    `,
    params
  );

  return rows;
}