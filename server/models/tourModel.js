// server/models/tourModel.js
import { db } from "../db.js";

// --------------------------------------------------
// Get Public Tours (with search, filters, sorting, pagination)
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
    whereParts.push("t.starting_price >= ?");
    params.push(Number(minPrice));
  }
  if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) {
    whereParts.push("t.starting_price <= ?");
    params.push(Number(maxPrice));
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  let orderBy;
  if (sort === "price-asc") orderBy = "ORDER BY t.starting_price ASC";
  else if (sort === "price-desc") orderBy = "ORDER BY t.starting_price DESC";
  else if (sort === "popular") orderBy = "ORDER BY t.popularity_score DESC, t.created_at DESC";
  else orderBy = "ORDER BY RAND()";

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
        t.starting_price,
        t.image_url
      FROM tours t
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `,
    [...params, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM tours t ${whereClause}`,
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
// --------------------------------------------------
export async function getPopularTours(limit = 6) {
  const [rows] = await db.query(
    `
      SELECT
        id,
        title,
        SUBSTRING(COALESCE(long_description, ''), 1, 140) AS short_description,
        location,
        latitude,
        longitude,
        type,
        starting_price,
        image_url
      FROM tours
      ORDER BY popularity_score DESC, created_at DESC
      LIMIT ?
    `,
    [Number(limit)]
  );

  return rows;
}

// --------------------------------------------------
// Get Single Tour + Agencies (Details Page)
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
        t.starting_price,
        t.image_url,
        t.max_capacity
      FROM tours t
      WHERE t.id = ?
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
        at.id,
        a.name AS agency_name,
        at.price,
        at.available_dates
      FROM agency_tours at
      INNER JOIN agencies a ON a.id = at.agency_id
      WHERE at.tour_id = ?
      ORDER BY at.price ASC
    `,
    [tourId]
  );

  return { tour, agencies: agencyRows };
}
