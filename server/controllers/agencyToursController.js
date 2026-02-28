// server/controllers/agencyToursController.js
import { db } from "../db.js";

function requireAgency(req, res) {
  const agencyId = req.user?.id;
  const role = req.user?.role;

  if (!agencyId || role !== "agency") {
    res.status(401).json({ message: "Agency authentication required." });
    return null;
  }
  return agencyId;
}

function normalizeStatus(v) {
  const s = String(v || "").toLowerCase().trim();
  if (s === "active" || s === "paused" || s === "completed") return s;
  return "";
}

function isValidDateStr(s) {
  const v = String(s || "").trim();
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function startMaxDateYMD() {
  const d = new Date();
  const day = d.getDate();
  d.setMonth(d.getMonth() + 3);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

function toYMD(date) {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* Option 2: store all dates as CSV in available_dates */
function buildAvailableDatesCsv(startYmd, endYmd) {
  const start = new Date(`${String(startYmd).slice(0, 10)}T00:00:00`);
  const end = new Date(`${String(endYmd).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (end < start) return "";

  const out = [];
  const cur = new Date(start);

  while (cur <= end) {
    out.push(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return out.join(",");
}

/* Shared tour identity */
function slugifyTour(title, location, type) {
  const raw = `${String(title || "")} ${String(location || "")} ${String(type || "")}`
    .toLowerCase()
    .trim();

  return raw
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 240);
}

async function agencyHasActiveOrPausedListing(agencyId, tourId) {
  const [[row]] = await db.query(
    `
    SELECT id
    FROM agency_tours
    WHERE agency_id = ? AND tour_id = ? AND listing_status IN ('active','paused')
    LIMIT 1
    `,
    [agencyId, tourId]
  );
  return !!row;
}

/* -------------------------
   Create "New Tour" flow:
-------------------------- */
export async function createAgencyTourController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const {
      title,
      description,
      location,
      type,
      latitude,
      longitude,
      starting_price,
      start_date,
      end_date,
      listing_status,
    } = req.body;

    if (!title || !description || !location || !type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const p = Number(starting_price);
    if (!Number.isFinite(p) || p <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0." });
    }

    if (!start_date || !end_date || !isValidDateStr(start_date) || !isValidDateStr(end_date)) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    /* Date window rules */
    const today = new Date(toYMD(new Date()));
    const start = new Date(start_date);
    const startMax = new Date(toYMD(startMaxDateYMD()));

    if (start < today) {
      return res.status(400).json({ message: "Start date cannot be in the past." });
    }
    if (start > startMax) {
      return res.status(400).json({ message: "Start date must be within 3 months from today." });
    }

    const minEnd = new Date(toYMD(addMonths(start_date, 1)));
    const maxEnd = new Date(toYMD(addMonths(start_date, 3)));
    const end = new Date(end_date);

    if (end < minEnd) {
      return res.status(400).json({ message: "End date must be at least 1 month after start." });
    }
    if (end > maxEnd) {
      return res.status(400).json({ message: "End date must be within 3 months after start." });
    }

    const la =
      latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null;
    const lo =
      longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null;

    if (la === null || lo === null || !Number.isFinite(la) || !Number.isFinite(lo)) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const st = listing_status ? normalizeStatus(listing_status) : "active";
    if (!st || st === "completed") {
      return res.status(400).json({ message: "Invalid status." });
    }

    const slug = slugifyTour(title, location, type);
    if (!slug) {
      return res.status(400).json({ message: "Invalid tour details." });
    }

    const [[existing]] = await db.query(`SELECT id FROM tours WHERE slug = ? LIMIT 1`, [slug]);

    if (existing?.id) {
      return res.status(409).json({
        message: "This tour already exists. Please add it from 'Add Existing Tour'.",
        existingTourId: Number(existing.id),
      });
    }

    const img = req.file ? `/uploads/tours/${req.file.filename}` : "";
    if (!img) return res.status(400).json({ message: "Cover image is required." });

    const [tourIns] = await db.query(
      `INSERT INTO tours
        (title, slug, long_description, location, latitude, longitude, type, starting_price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(title).trim(),
        slug,
        String(description).trim(),
        String(location).trim(),
        la,
        lo,
        String(type).trim(),
        p,
        img,
      ]
    );

    const tourId = tourIns.insertId;

    const available_dates = buildAvailableDatesCsv(start_date, end_date);
    if (!available_dates) {
      return res.status(400).json({ message: "Invalid dates." });
    }

    await db.query(
      `INSERT INTO agency_tours (agency_id, tour_id, price, start_date, end_date, available_dates, listing_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [agencyId, tourId, p, start_date, end_date, available_dates, st]
    );

    return res.status(201).json({
      message: "Tour created.",
      tourId,
      image_url: img,
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This tour already exists. Please add it from 'Add Existing Tour'.",
      });
    }

    console.error("createAgencyTourController error", err);
    return res.status(500).json({ message: "Failed to create tour." });
  }
}

/* -------------------------
   Manage Tours list
-------------------------- */
export async function listAgencyManageToursController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const q = String(req.query.q || "").trim();
    const statusRaw = String(req.query.status || "all").toLowerCase().trim();
    const sort = String(req.query.sort || "newest").toLowerCase().trim();

    const status =
      statusRaw === "active" ||
      statusRaw === "paused" ||
      statusRaw === "completed" ||
      statusRaw === "all"
        ? statusRaw
        : "all";

    const where = ["at.agency_id = ?"];
    const params = [agencyId];

    if (q) {
      where.push("(t.title LIKE ? OR t.location LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    if (status !== "all") {
      where.push("at.listing_status = ?");
      params.push(status);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;
    const orderBy = sort === "oldest" ? "ORDER BY at.created_at ASC" : "ORDER BY at.created_at DESC";

    const [rows] = await db.query(
      `
      SELECT
        at.id AS agency_tour_id,
        at.tour_id,
        at.price,
        at.start_date,
        at.end_date,
        at.available_dates,
        at.listing_status,
        at.created_at,
        t.title,
        t.location,
        t.image_url,
        t.long_description,
        t.type,
        t.latitude,
        t.longitude,
        (
          SELECT COUNT(*)
          FROM bookings b
          WHERE b.agency_tour_id = at.id
            AND b.booking_status <> 'Cancelled'
        ) AS bookings_count
      FROM agency_tours at
      INNER JOIN tours t ON t.id = at.tour_id
      ${whereSql}
      ${orderBy}
      `,
      params
    );

    return res.json({ data: rows });
  } catch (err) {
    console.error("listAgencyManageToursController error", err);
    return res.status(500).json({ message: "Failed to load tours." });
  }
}

/* -------------------------
   Update listing status (Active/Paused/Completed)
-------------------------- */
export async function updateAgencyTourStatusController(req, res) {
  const conn = await db.getConnection();
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const agencyTourId = Number(req.params.agencyTourId);
    if (!Number.isFinite(agencyTourId) || agencyTourId <= 0) {
      return res.status(400).json({ message: "Invalid tour id." });
    }

    const rawStatus =
      req.body?.status ??
      req.body?.listing_status ??
      req.query?.status ??
      req.query?.listing_status;

    const next = normalizeStatus(rawStatus);
    if (!next) {
      return res.status(400).json({ message: "Invalid status." });
    }

    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `SELECT listing_status FROM agency_tours WHERE id = ? AND agency_id = ? LIMIT 1`,
      [agencyTourId, agencyId]
    );

    if (!row) {
      await conn.rollback();
      return res.status(404).json({ message: "Tour not found." });
    }

    const current = String(row.listing_status || "").toLowerCase();

    if (current === "completed" && next !== "completed") {
      await conn.rollback();
      return res.status(400).json({ message: "Completed tours cannot be toggled." });
    }

    await conn.query(
      `
      UPDATE agency_tours
      SET listing_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND agency_id = ?
      `,
      [next, agencyTourId, agencyId]
    );

    if (next === "completed") {
      await conn.query(
        `
        UPDATE bookings
        SET booking_status = 'Completed'
        WHERE agency_tour_id = ?
          AND booking_status <> 'Cancelled'
          AND payment_status = 'Paid'
        `,
        [agencyTourId]
      );
    }

    await conn.commit();
    return res.json({ message: "Status updated." });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("updateAgencyTourStatusController error", err);
    return res.status(500).json({ message: "Failed to update status." });
  } finally {
    conn.release();
  }
}

/* -------------------------
   Update listing
-------------------------- */
export async function updateAgencyTourController(req, res) {
  const conn = await db.getConnection();
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const agencyTourId = Number(req.params.agencyTourId);
    if (!Number.isFinite(agencyTourId) || agencyTourId <= 0) {
      return res.status(400).json({ message: "Invalid tour id." });
    }

    const {
      title,
      description,
      location,
      type,
      latitude,
      longitude,
      price,
      start_date,
      end_date,
      listing_status,
    } = req.body;

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0." });
    }

    if (!start_date || !end_date || !isValidDateStr(start_date) || !isValidDateStr(end_date)) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const st = normalizeStatus(listing_status);
    if (!st) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const today = new Date(toYMD(new Date()));
    const start = new Date(start_date);
    const startMax = new Date(toYMD(startMaxDateYMD()));

    if (start < today) {
      return res.status(400).json({ message: "Start date cannot be in the past." });
    }
    if (start > startMax) {
      return res.status(400).json({ message: "Start date must be within 3 months from today." });
    }

    const minEnd = new Date(toYMD(addMonths(start_date, 1)));
    const maxEnd = new Date(toYMD(addMonths(start_date, 3)));
    const end = new Date(end_date);

    if (end < minEnd) {
      return res.status(400).json({ message: "End date must be at least 1 month after start." });
    }
    if (end > maxEnd) {
      return res.status(400).json({ message: "End date must be within 3 months after start." });
    }

    const la =
      latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null;
    const lo =
      longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null;

    if (la === null || lo === null || !Number.isFinite(la) || !Number.isFinite(lo)) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const newImage = req.file ? `/uploads/tours/${req.file.filename}` : null;

    const available_dates = buildAvailableDatesCsv(start_date, end_date);
    if (!available_dates) {
      return res.status(400).json({ message: "Invalid dates." });
    }

    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `SELECT tour_id FROM agency_tours WHERE id = ? AND agency_id = ? LIMIT 1`,
      [agencyTourId, agencyId]
    );

    if (!row) {
      await conn.rollback();
      return res.status(404).json({ message: "Tour not found." });
    }

    const tourId = Number(row.tour_id);

    const [[countRow]] = await conn.query(`SELECT COUNT(*) AS c FROM agency_tours WHERE tour_id = ?`, [
      tourId,
    ]);

    const isShared = Number(countRow?.c || 0) > 1;

    if (!isShared) {
      const slug = slugifyTour(title, location, type);

      await conn.query(
        `
        UPDATE tours
        SET title = ?, slug = ?, long_description = ?, location = ?, type = ?, latitude = ?, longitude = ?
        ${newImage ? ", image_url = ?" : ""}
        WHERE id = ?
        `,
        newImage
          ? [
              String(title).trim(),
              slug,
              String(description).trim(),
              String(location).trim(),
              String(type).trim(),
              la,
              lo,
              newImage,
              tourId,
            ]
          : [
              String(title).trim(),
              slug,
              String(description).trim(),
              String(location).trim(),
              String(type).trim(),
              la,
              lo,
              tourId,
            ]
      );
    }

    try {
      await conn.query(
        `
        UPDATE agency_tours
        SET price = ?, start_date = ?, end_date = ?, available_dates = ?, listing_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND agency_id = ?
        `,
        [p, start_date, end_date, available_dates, st, agencyTourId, agencyId]
      );
    } catch (e) {
      if (e?.code === "ER_DUP_ENTRY") {
        await conn.rollback();
        return res.status(400).json({
          message: "You already have a listing for these same dates. Change the dates and try again.",
        });
      }
      throw e;
    }

    await conn.commit();
    return res.json({
      message: isShared
        ? "Listing updated. (Master tour details are shared and cannot be changed.)"
        : "Tour updated.",
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("updateAgencyTourController error", err);
    return res.status(500).json({ message: "Failed to update tour." });
  } finally {
    conn.release();
  }
}

/* -------------------------
   Delete tour listing:
   Allow only if:
   - listing_status is active/paused
   - bookings_count (non-cancelled) is 0
-------------------------- */
export async function deleteAgencyTourController(req, res) {
  const conn = await db.getConnection();
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const agencyTourId = Number(req.params.agencyTourId);
    if (!Number.isFinite(agencyTourId) || agencyTourId <= 0) {
      return res.status(400).json({ message: "Invalid tour id." });
    }

    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `
      SELECT tour_id, listing_status
      FROM agency_tours
      WHERE id = ? AND agency_id = ?
      LIMIT 1
      `,
      [agencyTourId, agencyId]
    );

    if (!row) {
      await conn.rollback();
      return res.status(404).json({ message: "Tour not found." });
    }

    const tourId = Number(row.tour_id);
    const st = String(row.listing_status || "").toLowerCase();

    /* Only active/paused tours can be deleted */
    if (st !== "active" && st !== "paused") {
      await conn.rollback();
      return res.status(400).json({
        message: "Only Active or Paused tours can be deleted.",
      });
    }

    /* Match UI rule: bookings_count excludes Cancelled */
    const [[b]] = await conn.query(
      `
      SELECT COUNT(*) AS c
      FROM bookings
      WHERE agency_tour_id = ?
        AND booking_status <> 'Cancelled'
      `,
      [agencyTourId]
    );

    if (Number(b?.c || 0) > 0) {
      await conn.rollback();
      return res.status(400).json({
        message: "Cannot delete: this tour has bookings. Pause it instead.",
      });
    }

    await conn.query(`DELETE FROM agency_tours WHERE id = ? AND agency_id = ?`, [
      agencyTourId,
      agencyId,
    ]);

    const [[left]] = await conn.query(`SELECT COUNT(*) AS c FROM agency_tours WHERE tour_id = ?`, [
      tourId,
    ]);

    if (Number(left?.c || 0) === 0) {
      await conn.query(`DELETE FROM tours WHERE id = ?`, [tourId]);
    }

    await conn.commit();
    return res.json({ message: "Tour deleted." });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("deleteAgencyTourController error", err);
    return res.status(500).json({ message: "Failed to delete tour." });
  } finally {
    conn.release();
  }
}

/* Existing tours library */
export async function listExistingToursLibraryController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const q = String(req.query.q || "").trim();
    const typeRaw = String(req.query.type || "all").trim();
    const location = String(req.query.location || "all").trim();
    const sort = String(req.query.sort || "newest").toLowerCase().trim();

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = 6;
    const offset = (page - 1) * pageSize;

    const where = [
      `t.id NOT IN (
        SELECT at.tour_id
        FROM agency_tours at
        WHERE at.agency_id = ? AND at.listing_status IN ('active','paused')
      )`,
    ];
    const params = [agencyId];

    if (q) {
      where.push("(t.title LIKE ? OR t.location LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    if (location && location !== "all") {
      where.push("t.location = ?");
      params.push(location);
    }

    if (typeRaw && typeRaw !== "all") {
      where.push("t.type = ?");
      params.push(typeRaw);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let orderBy = "ORDER BY COALESCE(t.created_at, t.id) DESC, t.id DESC";
    if (sort === "oldest") {
      orderBy = "ORDER BY COALESCE(t.created_at, t.id) ASC, t.id ASC";
    }
    if (sort === "price-asc") {
      orderBy = "ORDER BY CAST(COALESCE(t.starting_price, 0) AS DECIMAL(10,2)) ASC, t.id DESC";
    }
    if (sort === "price-desc") {
      orderBy = "ORDER BY CAST(COALESCE(t.starting_price, 0) AS DECIMAL(10,2)) DESC, t.id DESC";
    }

    const [[countRow]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM tours t
      ${whereSql}
      `,
      params
    );

    const total = Number(countRow?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [rows] = await db.query(
      `
      SELECT
        t.id,
        t.title,
        t.location,
        t.type,
        t.starting_price,
        t.image_url,
        (
          SELECT CONCAT(COALESCE(at.start_date,''),'|',COALESCE(at.end_date,''))
          FROM agency_tours at
          WHERE at.tour_id = t.id
          ORDER BY at.created_at DESC
          LIMIT 1
        ) AS available_dates_hint
      FROM tours t
      ${whereSql}
      ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    return res.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error("listExistingToursLibraryController error", err);
    return res.status(500).json({ message: "Failed to load existing tours." });
  }
}

export async function listExistingToursLocationsController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const [rows] = await db.query(
      `
      SELECT DISTINCT t.location
      FROM tours t
      WHERE t.location IS NOT NULL AND t.location <> ''
      ORDER BY t.location ASC
      `
    );

    const locations = rows.map((r) => r.location).filter(Boolean);
    return res.json({ data: locations });
  } catch (err) {
    console.error("listExistingToursLocationsController error", err);
    return res.status(500).json({ message: "Failed to load locations." });
  }
}

export async function addExistingTourListingController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const tourId = Number(req.params.tourId);
    if (!Number.isFinite(tourId) || tourId <= 0) {
      return res.status(400).json({ message: "Invalid tour id." });
    }

    const price = Number(req.body?.price);
    const start_date = String(req.body?.start_date || "").trim();
    const end_date = String(req.body?.end_date || "").trim();
    const st = normalizeStatus(req.body?.listing_status || "active");

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0." });
    }

    if (!start_date || !end_date || !isValidDateStr(start_date) || !isValidDateStr(end_date)) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const today = new Date(toYMD(new Date()));
    const start = new Date(start_date);
    const startMax = new Date(toYMD(startMaxDateYMD()));

    if (start < today) {
      return res.status(400).json({ message: "Start date cannot be in the past." });
    }

    if (start > startMax) {
      return res.status(400).json({ message: "Start date must be within 3 months from today." });
    }

    const minEnd = new Date(toYMD(addMonths(start_date, 1)));
    const maxEnd = new Date(toYMD(addMonths(start_date, 3)));
    const end = new Date(end_date);

    if (end < minEnd) {
      return res.status(400).json({ message: "End date must be at least 1 month after start." });
    }

    if (end > maxEnd) {
      return res.status(400).json({ message: "End date must be within 3 months after start." });
    }

    if (!st || st === "completed") {
      return res.status(400).json({ message: "Invalid status." });
    }

    const [[tour]] = await db.query(`SELECT id FROM tours WHERE id = ? LIMIT 1`, [tourId]);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found." });
    }

    const hasLive = await agencyHasActiveOrPausedListing(agencyId, tourId);
    if (hasLive) {
      return res.status(400).json({
        message: "You already have this tour in Active/Paused. Complete it first, then you can add it again.",
      });
    }

    const available_dates = buildAvailableDatesCsv(start_date, end_date);
    if (!available_dates) {
      return res.status(400).json({ message: "Invalid dates." });
    }

    try {
      await db.query(
        `INSERT INTO agency_tours (agency_id, tour_id, price, start_date, end_date, available_dates, listing_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [agencyId, tourId, price, start_date, end_date, available_dates, st]
      );
    } catch (e) {
      if (e?.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          message: "You already created a listing with these same dates for this tour.",
        });
      }
      throw e;
    }

    return res.status(201).json({ message: "Tour added to your listings." });
  } catch (err) {
    console.error("addExistingTourListingController error", err);
    return res.status(500).json({ message: "Failed to add tour." });
  }
}