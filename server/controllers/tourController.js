// server/controllers/tourController.js
import { getPublicTours, getPopularTours, getPublicTourDetails } from "../models/tourModel.js";

// --------------------------------------------------
// List tours (search / filter / sort / pagination)
// --------------------------------------------------
export async function getPublicToursController(req, res) {
  try {
    const tours = await getPublicTours(req.query);
    res.json(tours);
  } catch (err) {
    console.error("getPublicToursController error", err);
    res.status(500).json({ message: "Failed to fetch tours" });
  }
}

// --------------------------------------------------
// Home data: popular tours + (later blogs, etc.)
// --------------------------------------------------
export async function getPublicHomeController(req, res) {
  try {
    const popularTours = await getPopularTours(10); // or 6, as you like

    // For now, just empty array for blogs (you already mapped)
    // Later you will plug real blogs table.
    const latestBlogs = [];

    res.json({
      popularTours,
      latestBlogs,
    });
  } catch (err) {
    console.error("getPublicHomeController error", err);
    res.status(500).json({ message: "Failed to fetch home data" });
  }
}

// --------------------------------------------------
// Single tour details (tour + agencies)
// --------------------------------------------------
export async function getPublicTourDetailsController(req, res) {
  try {
    const { tourId } = req.params;
    const result = await getPublicTourDetails(tourId);

    if (!result) {
      return res.status(404).json({ message: "Tour not found" });
    }

    res.json(result); // { tour, agencies }
  } catch (err) {
    console.error("getPublicTourDetailsController error", err);
    res.status(500).json({ message: "Failed to fetch tour details" });
  }
}
