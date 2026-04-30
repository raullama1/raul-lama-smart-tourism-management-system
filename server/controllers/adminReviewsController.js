// server/controllers/adminReviewsController.js
import { getAgencyReviews } from "../models/agencyReviewsModel.js";

export async function getAgencyReviewsController(req, res) {
  try {
    const agencyId = req.user?.id;
    const role = req.user?.role;

    if (!agencyId || role !== "agency") {
      return res.status(401).json({ message: "Agency authentication required." });
    }

    const reviews = await getAgencyReviews(agencyId, req.query);

    return res.json({ reviews });
  } catch (err) {
    console.error("getAgencyReviewsController error", err);
    return res.status(500).json({ message: "Failed to load reviews." });
  }
}