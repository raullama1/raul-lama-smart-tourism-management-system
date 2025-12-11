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
    // "" | "popular" | "price-asc" | "price-desc"
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
  if (minPrice) {
    whereParts.push("t.starting_price >= ?");
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    whereParts.push("t.starting_price <= ?");
    params.push(Number(maxPrice));
  }

  const whereClause = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  // 🔥 sort logic
  let orderBy;
  if (sort === "price-asc") {
    orderBy = "ORDER BY t.starting_price ASC";
  } else if (sort === "price-desc") {
    orderBy = "ORDER BY t.starting_price DESC";
  } else if (sort === "popular") {
    orderBy = "ORDER BY t.popularity_score DESC, t.created_at DESC";
  } else {
    // Default → random tours
    orderBy = "ORDER BY RAND()";
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        t.short_description,
        t.location,
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
        short_description,
        location,
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
  // 1) Get the tour itself
  const [tourRows] = await db.query(
    `
      SELECT
        t.id,
        t.title,
        t.short_description,
        t.long_description,
        t.location,
        t.type,
        t.starting_price,
        t.image_url
      FROM tours t
      WHERE t.id = ?
      LIMIT 1
    `,
    [tourId]
  );

  if (tourRows.length === 0) {
    return null; // no tour
  }

  const tour = tourRows[0];

  // Make sure front-end always has "description"
  tour.description =
    tour.long_description ||
    tour.short_description ||
    "";

  // 2) Get agencies offering this tour
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

  return {
    tour,
    agencies: agencyRows,
  };
}
