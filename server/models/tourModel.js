// server/models/tourModel.js
import { db } from "../db.js";

function sqlStartDateExpr() {
  return `
    COALESCE(
      at.start_date,
      STR_TO_DATE(SUBSTRING_INDEX(at.available_dates, '|', 1), '%Y-%m-%d')
    )
  `;
}

function sqlEndDateExpr() {
  return `
    COALESCE(
      at.end_date,
      STR_TO_DATE(SUBSTRING_INDEX(at.available_dates, '|', -1), '%Y-%m-%d')
    )
  `;
}

// Get Public Tours
export async function getPublicTours(filters) {
  const {
    search = "",
    location = "",
    type = "",
    minPrice = "",
    maxPrice = "",
    sort = "",
    page = 1,
    limit = 6,
  } = filters;

  const whereParts = [];
  const params = [];

  whereParts.push("at.listing_status = 'active'");
  whereParts.push("a.is_blocked = 0");

  if (search) {
    whereParts.push("t.title LIKE ?");
    params.push(`%${search}%`);
  }

  if (location) {
    whereParts.push("t.location LIKE ?");
    params.push(`%${location}%`);
  }

  if (type) {
    whereParts.push("t.type = ?");
    params.push(type);
  }

  if (minPrice !== "" && minPrice !== null && minPrice !== undefined) {
    whereParts.push("at.price >= ?");
    params.push(Number(minPrice));
  }

  if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) {
    whereParts.push("at.price <= ?");
    params.push(Number(maxPrice));
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  let orderBy = "";
  if (sort === "price-asc") orderBy = "ORDER BY starting_price ASC";
  else if (sort === "price-desc") orderBy = "ORDER BY starting_price DESC";
  else if (sort === "popular") {
    orderBy = "ORDER BY t.popularity_score DESC, latest_created DESC";
  } else {
    orderBy = "ORDER BY latest_created DESC";
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        SUBSTRING(COALESCE(t.long_description, ''), 1, 140) AS short_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        MIN(at.price) AS starting_price,
        t.image_url,
        MAX(COALESCE(t.created_at, t.id)) AS latest_created
      FROM tours t
      INNER JOIN agency_tours at ON at.tour_id = t.id
      INNER JOIN agencies a ON a.id = at.agency_id
      ${whereClause}
      GROUP BY
        t.id,
        t.title,
        t.long_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        t.image_url
      ${orderBy}
      LIMIT ? OFFSET ?
    `,
    [...params, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM tours t
      INNER JOIN agency_tours at ON at.tour_id = t.id
      INNER JOIN agencies a ON a.id = at.agency_id
      ${whereClause}
    `,
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

// Get title-only autocomplete suggestions
export async function getPublicTourSuggestions(q, limit = 8) {
  const keyword = String(q || "").trim();

  if (!keyword) {
    return [];
  }

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        t.location
      FROM tours t
      INNER JOIN agency_tours at ON at.tour_id = t.id
      INNER JOIN agencies a ON a.id = at.agency_id
      WHERE at.listing_status = 'active'
        AND a.is_blocked = 0
        AND t.title LIKE ?
      GROUP BY t.id, t.title, t.location
      ORDER BY
        CASE
          WHEN t.title LIKE ? THEN 0
          ELSE 1
        END,
        t.popularity_score DESC,
        COALESCE(t.created_at, CURRENT_TIMESTAMP) DESC
      LIMIT ?
    `,
    [`%${keyword}%`, `${keyword}%`, Number(limit)]
  );

  return rows;
}

// Get Popular Tours
export async function getPopularTours(limit = 6) {
  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        SUBSTRING(COALESCE(t.long_description, ''), 1, 140) AS short_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        MIN(at.price) AS starting_price,
        t.image_url
      FROM tours t
      INNER JOIN agency_tours at ON at.tour_id = t.id
      INNER JOIN agencies a ON a.id = at.agency_id
      WHERE at.listing_status = 'active'
        AND a.is_blocked = 0
      GROUP BY
        t.id,
        t.title,
        t.long_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        t.image_url
      ORDER BY t.popularity_score DESC, COALESCE(t.created_at, t.id) DESC
      LIMIT ?
    `,
    [Number(limit)]
  );

  return rows;
}

// Get Recommended Tours For Tourist Home
export async function getRecommendedToursForUser(userId, limit = 8) {
  const [wishlistRows] = await db.query(
    `
      SELECT DISTINCT
        t.id,
        t.type
      FROM wishlists w
      INNER JOIN tours t ON t.id = w.tour_id
      WHERE w.user_id = ?
        AND t.type IS NOT NULL
        AND t.type <> ''
    `,
    [userId]
  );

  const [paidRows] = await db.query(
    `
      SELECT DISTINCT
        t.id,
        t.type
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      WHERE b.user_id = ?
        AND b.payment_status = 'Paid'
        AND t.type IS NOT NULL
        AND t.type <> ''
    `,
    [userId]
  );

  const typeScoreMap = new Map();
  const sourceTourIds = new Set();

  for (const row of wishlistRows) {
    const type = String(row.type || "").trim();
    const id = Number(row.id);

    if (type) {
      typeScoreMap.set(type, (typeScoreMap.get(type) || 0) + 1);
    }

    if (id) {
      sourceTourIds.add(id);
    }
  }

  for (const row of paidRows) {
    const type = String(row.type || "").trim();
    const id = Number(row.id);

    if (type) {
      typeScoreMap.set(type, (typeScoreMap.get(type) || 0) + 1);
    }

    if (id) {
      sourceTourIds.add(id);
    }
  }

  const preferredTypes = [...typeScoreMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([type]) => type);

  if (!preferredTypes.length) {
    return [];
  }

  const typePlaceholders = preferredTypes.map(() => "?").join(",");
  const excludedIds = [...sourceTourIds];
  const excludeClause = excludedIds.length
    ? `AND t.id NOT IN (${excludedIds.map(() => "?").join(",")})`
    : "";

  const [candidateRows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        SUBSTRING(COALESCE(t.long_description, ''), 1, 140) AS short_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        MIN(at.price) AS starting_price,
        t.image_url,
        COALESCE(t.popularity_score, 0) AS popularity_score,
        COALESCE(t.created_at, CURRENT_TIMESTAMP) AS created_at
      FROM tours t
      INNER JOIN agency_tours at ON at.tour_id = t.id
      INNER JOIN agencies a ON a.id = at.agency_id
      WHERE at.listing_status = 'active'
        AND a.is_blocked = 0
        AND t.type IN (${typePlaceholders})
        ${excludeClause}
      GROUP BY
        t.id,
        t.title,
        t.long_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        t.image_url,
        t.popularity_score,
        t.created_at
    `,
    [...preferredTypes, ...excludedIds]
  );

  if (!candidateRows.length) {
    return [];
  }

  const groupedByType = new Map();

  for (const type of preferredTypes) {
    groupedByType.set(type, []);
  }

  for (const row of candidateRows) {
    const type = String(row.type || "").trim();
    if (!groupedByType.has(type)) {
      groupedByType.set(type, []);
    }
    groupedByType.get(type).push(row);
  }

  for (const [type, rows] of groupedByType.entries()) {
    rows.sort((a, b) => {
      const scoreA = typeScoreMap.get(type) || 0;
      const scoreB = typeScoreMap.get(type) || 0;

      if (scoreB !== scoreA) return scoreB - scoreA;

      const popularityDiff =
        Number(b.popularity_score || 0) - Number(a.popularity_score || 0);
      if (popularityDiff !== 0) return popularityDiff;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  const picked = [];
  let hasRemaining = true;

  while (hasRemaining && picked.length < Number(limit)) {
    hasRemaining = false;

    for (const type of preferredTypes) {
      const rows = groupedByType.get(type) || [];
      if (!rows.length) continue;

      hasRemaining = true;
      picked.push(rows.shift());

      if (picked.length >= Number(limit)) {
        break;
      }
    }
  }

  return picked;
}

// Get Single Tour + Agencies
export async function getPublicTourDetails(tourId) {
  const [tourRows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        SUBSTRING(COALESCE(t.long_description, ''), 1, 140) AS short_description,
        t.long_description,
        t.location,
        t.latitude,
        t.longitude,
        t.type,
        t.image_url
      FROM tours t
      WHERE t.id = ?
        AND EXISTS (
          SELECT 1
          FROM agency_tours at
          INNER JOIN agencies a ON a.id = at.agency_id
          WHERE at.tour_id = t.id
            AND at.listing_status = 'active'
            AND a.is_blocked = 0
        )
      LIMIT 1
    `,
    [tourId]
  );

  if (tourRows.length === 0) return null;

  const tour = tourRows[0];
  tour.description = tour.long_description || tour.short_description || "";

  const [agencyRows] = await db.query(
    `
      SELECT
        at.id AS agency_tour_id,
        at.agency_id,
        a.name AS agency_name,
        at.price,
        at.available_dates,
        ${sqlStartDateExpr()} AS start_date,
        ${sqlEndDateExpr()} AS end_date
      FROM agency_tours at
      INNER JOIN agencies a ON a.id = at.agency_id
      WHERE at.tour_id = ?
        AND at.listing_status = 'active'
        AND a.is_blocked = 0
      ORDER BY at.price ASC
    `,
    [tourId]
  );

  if (!agencyRows || agencyRows.length === 0) return null;

  return { tour, agencies: agencyRows };
}