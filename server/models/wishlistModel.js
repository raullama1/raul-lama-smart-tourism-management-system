import { db } from "../db.js";

export async function addToWishlist(userId, tourId) {
  // INSERT IGNORE avoids duplicate error due to UNIQUE(user_id, tour_id)
  const [res] = await db.query(
    `INSERT IGNORE INTO wishlists (user_id, tour_id) VALUES (?, ?)`,
    [userId, tourId]
  );

  // ✅ true = inserted, false = duplicate ignored
  return res.affectedRows > 0;
}

export async function removeFromWishlist(userId, tourId) {
  const [res] = await db.query(
    `DELETE FROM wishlists WHERE user_id = ? AND tour_id = ?`,
    [userId, tourId]
  );
  return res.affectedRows > 0;
}

export async function getWishlistItems(userId) {
  const [rows] = await db.query(
    `
    SELECT
      t.id,
      t.title,
      t.location,
      t.type,
      t.starting_price,
      t.image_url,
      COALESCE(ag.agency_count, 0) AS agency_count
    FROM wishlists w
    INNER JOIN tours t ON t.id = w.tour_id
    LEFT JOIN (
      SELECT tour_id, COUNT(*) AS agency_count
      FROM agency_tours
      GROUP BY tour_id
    ) ag ON ag.tour_id = t.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function getWishlistTourIds(userId) {
  const [rows] = await db.query(
    `SELECT tour_id FROM wishlists WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => Number(r.tour_id));
}
