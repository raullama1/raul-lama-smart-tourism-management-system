// server/controllers/agencyToursController.js
import { db } from "../db.js";

export async function createAgencyTourController(req, res) {
  try {
    const agencyId = req.user?.id;
    const role = req.user?.role;

    if (!agencyId || role !== "agency") {
      return res.status(401).json({ message: "Agency authentication required." });
    }

    const {
      title,
      description,
      location,
      type,
      latitude,
      longitude,
      starting_price,
      max_capacity,
      start_date,
      end_date,
    } = req.body;

    if (!title || !description || !location || !type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!starting_price || Number(starting_price) <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0." });
    }

    if (!max_capacity || Number(max_capacity) <= 0) {
      return res.status(400).json({ message: "Max capacity must be greater than 0." });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const img = req.file ? `/uploads/tours/${req.file.filename}` : "";
    if (!img) return res.status(400).json({ message: "Cover image is required." });

    const short = String(description).trim().slice(0, 200);

    // 1) Create tour (global tours table)
    const [tourIns] = await db.query(
      `INSERT INTO tours
        (title, short_description, long_description, location, latitude, longitude, type, starting_price, max_capacity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(title).trim(),
        short,
        String(description).trim(),
        String(location).trim(),
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        String(type).trim(),
        Number(starting_price),
        Number(max_capacity),
        img,
      ]
    );

    const tourId = tourIns.insertId;

    // 2) Link to agency_tours
    const available_dates = `${start_date}|${end_date}`;

    await db.query(
      `INSERT INTO agency_tours (agency_id, tour_id, price, available_dates)
       VALUES (?, ?, ?, ?)`,
      [agencyId, tourId, Number(starting_price), available_dates]
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
