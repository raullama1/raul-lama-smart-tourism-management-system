// server/models/tourModel.js
import { db } from "../db.js";

/**
 * Public/Tourist visibility rule:
 * - Tourist side should only see tours that have at least 1 ACTIVE agency listing.
 * - Paused/Draft/Completed listings stay in DB, visible only in agency pages.
 *
 * Implementation detail:
 * - Join `tours` with `agency_tours` and force `at.listing_status = 'active'`.
 * - Group by tour to avoid duplicates (many agencies can list the same tour).
 * - Use MIN(at.price) as the public "starting_price".
 *
 * Seasons support:
 * - Listings now store start_date/end_date in agency_tours.
 * - Old rows might still have only `available_dates` ("YYYY-MM-DD|YYYY-MM-DD").
 * - We return both, and for public side we compute display_start_date/end_date with fallback.
 */

function sqlStartDateExpr() {
  // Prefer real column; fallback to parsing available_dates
  return `
    COALESCE(
      at.start_date,
      STR_TO_DATE(SUBSTRING_INDEX(at.available_dates, '|', 1), '%Y-%m-%d')
    )
  `;
}

function sqlEndDateExpr() {
  // Prefer real column; fallback to parsing available_dates
  return `
    COALESCE(
      at.end_date,
      STR_TO_DATE(SUBSTRING_INDEX(at.available_dates, '|', -1), '%Y-%m-%d')
    )
  `;
}

// --------------------------------------------------
// Get Public Tours (search, filters, sorting, pagination)
// ONLY tours that have ACTIVE agency listings
// --------------------------------------------------
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

  if (search) {
    whereParts.push("(t.title LIKE ? OR t.location LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
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

  // Sorting on computed columns (starting_price / latest_created)
  let orderBy = "";
  if (sort === "price-asc") orderBy = "ORDER BY starting_price ASC";
  else if (sort === "price-desc") orderBy = "ORDER BY starting_price DESC";
  else if (sort === "popular") orderBy = "ORDER BY t.popularity_score DESC, latest_created DESC";
  else orderBy = "ORDER BY latest_created DESC";

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
      ${whereClause}
      GROUP BY
        t.id, t.title, t.long_description, t.location, t.latitude, t.longitude, t.type, t.image_url
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

// --------------------------------------------------
// Get Popular Tours (Home Page)
// ONLY tours that have ACTIVE agency listings
// --------------------------------------------------
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
      WHERE at.listing_status = 'active'
      GROUP BY
        t.id, t.title, t.long_description, t.location, t.latitude, t.longitude, t.type, t.image_url
      ORDER BY t.popularity_score DESC, COALESCE(t.created_at, t.id) DESC
      LIMIT ?
    `,
    [Number(limit)]
  );

  return rows;
}

// --------------------------------------------------
// Get Single Tour + Agencies (Details Page)
// Public side:
// - Tour must have at least 1 ACTIVE agency listing, otherwise 404
// - Agencies list must show only ACTIVE listings
// - Return start/end dates (with fallback) for seasons
// --------------------------------------------------
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
          WHERE at.tour_id = t.id
            AND at.listing_status = 'active'
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
      ORDER BY at.price ASC
    `,
    [tourId]
  );

  if (!agencyRows || agencyRows.length === 0) return null;

  return { tour, agencies: agencyRows };
}