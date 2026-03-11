// server/controllers/adminReviewsController.js
import {
  getAllAdminReviews,
  deleteAdminReviewById,
} from "../models/adminReviewsModel.js";

export async function getAdminReviewsController(req, res) {
  try {
    const reviews = await getAllAdminReviews(req.query);
    return res.json({ reviews });
  } catch {
    return res.status(500).json({ message: "Failed to load reviews." });
  }
}

export async function deleteAdminReviewController(req, res) {
  try {
    const ok = await deleteAdminReviewById(req.params.reviewId);

    if (!ok) {
      return res.status(404).json({ message: "Review not found." });
    }

    return res.json({ message: "Review deleted." });
  } catch {
    return res.status(500).json({ message: "Failed to delete review." });
  }
}