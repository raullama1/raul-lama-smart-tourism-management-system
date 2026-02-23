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
  if (s === "active" || s === "paused") return s;
  return "";
}

function isValidDateStr(s) {
  const v = String(s || "").trim();
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

/* ---- Date rules (same idea as AgencyAddTourPage) ---- */
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

    if (!starting_price || Number(starting_price) <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0." });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const la =
      latitude !== undefined && latitude !== null && latitude !== ""
        ? Number(latitude)
        : null;
    const lo =
      longitude !== undefined && longitude !== null && longitude !== ""
        ? Number(longitude)
        : null;

    if (la === null || lo === null || !Number.isFinite(la) || !Number.isFinite(lo)) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const img = req.file ? `/uploads/tours/${req.file.filename}` : "";
    if (!img) return res.status(400).json({ message: "Cover image is required." });

    const st = listing_status ? normalizeStatus(listing_status) : "active";
    if (!st) return res.status(400).json({ message: "Invalid status." });

    const [tourIns] = await db.query(
      `INSERT INTO tours
        (title, long_description, location, latitude, longitude, type, starting_price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(title).trim(),
        String(description).trim(),
        String(location).trim(),
        la,
        lo,
        String(type).trim(),
        Number(starting_price),
        img,
      ]
    );

    const tourId = tourIns.insertId;
    const available_dates = `${start_date}|${end_date}`;

    await db.query(
      `INSERT INTO agency_tours (agency_id, tour_id, price, available_dates, listing_status)
       VALUES (?, ?, ?, ?, ?)`,
      [agencyId, tourId, Number(starting_price), available_dates, st]
    );

    return res.status(201).json({
      message: "Tour created.",
      tourId,
      image_url: img,
    });
  } catch (err) {
    console.error("createAgencyTourController error", err);
    return res.status(500).json({ message: "Failed to create tour." });
  }
}

export async function listAgencyManageToursController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const q = String(req.query.q || "").trim();
    const statusRaw = String(req.query.status || "all").toLowerCase().trim();
    const sort = String(req.query.sort || "newest").toLowerCase().trim();

    const status =
      statusRaw === "active" || statusRaw === "paused" || statusRaw === "all"
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
    const orderBy =
      sort === "oldest"
        ? "ORDER BY at.created_at ASC"
        : "ORDER BY at.created_at DESC";

    const [rows] = await db.query(
      `
      SELECT
        at.id AS agency_tour_id,
        at.tour_id,
        at.price,
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

export async function updateAgencyTourStatusController(req, res) {
  try {
    const agencyId = requireAgency(req, res);
    if (!agencyId) return;

    const agencyTourId = Number(req.params.agencyTourId);
    if (!Number.isFinite(agencyTourId) || agencyTourId <= 0) {
      return res.status(400).json({ message: "Invalid tour id." });
    }

    const next = normalizeStatus(req.body?.status);
    if (!next) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const [result] = await db.query(
      `
      UPDATE agency_tours
      SET listing_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND agency_id = ?
      `,
      [next, agencyTourId, agencyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tour not found." });
    }

    return res.json({ message: "Status updated." });
  } catch (err) {
    console.error("updateAgencyTourStatusController error", err);
    return res.status(500).json({ message: "Failed to update status." });
  }
}

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

    if (!title || !description || !location || !type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

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

    const la =
      latitude !== undefined && latitude !== null && latitude !== ""
        ? Number(latitude)
        : null;
    const lo =
      longitude !== undefined && longitude !== null && longitude !== ""
        ? Number(longitude)
        : null;

    if (la === null || lo === null || !Number.isFinite(la) || !Number.isFinite(lo)) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const available_dates = `${String(start_date).trim()}|${String(end_date).trim()}`;
    const newImage = req.file ? `/uploads/tours/${req.file.filename}` : null;

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

    await conn.query(
      `
      UPDATE tours
      SET title = ?, long_description = ?, location = ?, type = ?, latitude = ?, longitude = ?
      ${newImage ? ", image_url = ?" : ""}
      WHERE id = ?
      `,
      newImage
        ? [
            String(title).trim(),
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
            String(description).trim(),
            String(location).trim(),
            String(type).trim(),
            la,
            lo,
            tourId,
          ]
    );

    await conn.query(
      `
      UPDATE agency_tours
      SET price = ?, available_dates = ?, listing_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND agency_id = ?
      `,
      [p, available_dates, st, agencyTourId, agencyId]
    );

    await conn.commit();
    return res.json({ message: "Tour updated." });
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
      `SELECT tour_id FROM agency_tours WHERE id = ? AND agency_id = ? LIMIT 1`,
      [agencyTourId, agencyId]
    );

    if (!row) {
      await conn.rollback();
      return res.status(404).json({ message: "Tour not found." });
    }

    const tourId = Number(row.tour_id);

    const [[b]] = await conn.query(
      `SELECT COUNT(*) AS c FROM bookings WHERE agency_tour_id = ?`,
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

    const [[left]] = await conn.query(
      `SELECT COUNT(*) AS c FROM agency_tours WHERE tour_id = ?`,
      [tourId]
    );

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

/* Screen 27: list tours that this agency has NOT added yet (with pagination) */
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
      "t.id NOT IN (SELECT at.tour_id FROM agency_tours at WHERE at.agency_id = ?)",
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

    /* Stable sort even if created_at is NULL and starting_price is string/NULL */
    let orderBy = "ORDER BY COALESCE(t.created_at, t.id) DESC, t.id DESC";
    if (sort === "oldest") {
      orderBy = "ORDER BY COALESCE(t.created_at, t.id) ASC, t.id ASC";
    }
    if (sort === "price-asc") {
      orderBy =
        "ORDER BY CAST(COALESCE(t.starting_price, 0) AS DECIMAL(10,2)) ASC, t.id DESC";
    }
    if (sort === "price-desc") {
      orderBy =
        "ORDER BY CAST(COALESCE(t.starting_price, 0) AS DECIMAL(10,2)) DESC, t.id DESC";
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
          SELECT at.available_dates
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

/* Screen 27: add existing tour listing for this agency (block duplicates + date rules) */
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

    if (!st) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const [[tour]] = await db.query(`SELECT id FROM tours WHERE id = ? LIMIT 1`, [tourId]);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found." });
    }

    const [[exists]] = await db.query(
      `SELECT id FROM agency_tours WHERE agency_id = ? AND tour_id = ? LIMIT 1`,
      [agencyId, tourId]
    );

    if (exists) {
      return res.status(400).json({
        message: "You already added this tour. Manage it from Manage Tour.",
      });
    }

    const available_dates = `${start_date}|${end_date}`;

    try {
      await db.query(
        `INSERT INTO agency_tours (agency_id, tour_id, price, available_dates, listing_status)
         VALUES (?, ?, ?, ?, ?)`,
        [agencyId, tourId, price, available_dates, st]
      );
    } catch (e) {
      if (e?.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          message: "You already added this tour. Manage it from Manage Tour.",
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