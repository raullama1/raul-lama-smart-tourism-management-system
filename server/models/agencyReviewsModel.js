// server/models/agencyReviewsModel.js
import { db } from "../db.js";

export async function getAgencyReviews({
  agencyId,
  search = "",
  sort = "newest",
  rating = "any",
  page = 1,
  limit = 100,
}) {
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : 100;
  const offset = (pageNum - 1) * limitNum;

  const normalizedSort =
    String(sort || "").trim().toLowerCase() === "oldest" ? "oldest" : "newest";

  const whereParts = ["r.agency_id = ?"];
  const params = [agencyId];

  if (search && String(search).trim()) {
    const s = `%${String(search).trim()}%`;
    whereParts.push("(u.name LIKE ? OR t.title LIKE ?)");
    params.push(s, s);
  }

  const numericRating = Number(rating);
  if (
    String(rating).trim().toLowerCase() !== "any" &&
    [1, 2, 3, 4, 5].includes(numericRating)
  ) {
    whereParts.push("r.rating = ?");
    params.push(numericRating);
  }

  const whereClause = `WHERE ${whereParts.join(" AND ")}`;

  let orderBy = "ORDER BY r.created_at DESC, r.id DESC";
  if (normalizedSort === "oldest") {
    orderBy = "ORDER BY r.created_at ASC, r.id ASC";
  }

  const [rows] = await db.query(
    `SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        COALESCE(NULLIF(TRIM(u.name), ''), 'Tourist') AS tourist_name,
        u.profile_image AS tourist_profile_image,
        t.title AS tour_name
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN tours t ON t.id = r.tour_id
     ${whereClause}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN tours t ON t.id = r.tour_id
     ${whereClause}`,
    params
  );

  return {
    reviews: rows,
    pagination: {
      total: Number(total || 0),
      page: pageNum,
      limit: limitNum,
      hasMore: offset + rows.length < Number(total || 0),
    },
  };
}