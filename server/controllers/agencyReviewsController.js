// server/controllers/agencyReviewsController.js
import { getAgencyReviews } from "../models/agencyReviewsModel.js";

function getAgencyId(req, res) {
  const agencyId = req.user?.id;
  const role = req.user?.role;

  if (!agencyId || role !== "agency") {
    res.status(401).json({ message: "Agency authentication required." });
    return null;
  }

  return agencyId;
}

export async function getAgencyReviewsController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const sort =
      String(req.query?.sort || "").trim().toLowerCase() === "oldest"
        ? "oldest"
        : "newest";

    const ratingRaw = String(req.query?.rating || "any").trim().toLowerCase();
    const rating =
      ratingRaw === "any" ? "any" : String(Number(req.query?.rating || 0));

    const result = await getAgencyReviews({
      agencyId,
      search: req.query?.search || "",
      sort,
      rating,
      page: req.query?.page || 1,
      limit: req.query?.limit || 100,
    });

    return res.json(result);
  } catch (err) {
    console.error("getAgencyReviewsController error", err);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
}