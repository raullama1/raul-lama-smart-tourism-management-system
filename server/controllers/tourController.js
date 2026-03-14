// server/controllers/tourController.js
import {
  getPublicTours,
  getPopularTours,
  getPublicTourDetails,
  getPublicTourSuggestions,
} from "../models/tourModel.js";

// List tours
export async function getPublicToursController(req, res) {
  try {
    const tours = await getPublicTours(req.query);
    res.json(tours);
  } catch (err) {
    console.error("getPublicToursController error", err);
    res.status(500).json({ message: "Failed to fetch tours" });
  }
}

// Title autocomplete suggestions
export async function getPublicTourSuggestionsController(req, res) {
  try {
    const q = String(req.query?.q || "").trim();
    const suggestions = await getPublicTourSuggestions(q);

    res.json({
      data: suggestions,
    });
  } catch (err) {
    console.error("getPublicTourSuggestionsController error", err);
    res.status(500).json({ message: "Failed to fetch tour suggestions" });
  }
}

// Home data
export async function getPublicHomeController(req, res) {
  try {
    const popularTours = await getPopularTours(10);
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

// Single tour details
export async function getPublicTourDetailsController(req, res) {
  try {
    const { tourId } = req.params;
    const result = await getPublicTourDetails(tourId);

    if (!result) {
      return res.status(404).json({ message: "Tour not found" });
    }

    res.json(result);
  } catch (err) {
    console.error("getPublicTourDetailsController error", err);
    res.status(500).json({ message: "Failed to fetch tour details" });
  }
}