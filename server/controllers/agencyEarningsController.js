// server/controllers/agencyEarningsController.js
import { getAgencyEarnings } from "../models/agencyEarningsModel.js";

function getAgencyId(req, res) {
  const agencyId = req.user?.id;
  const role = req.user?.role;

  if (!agencyId || role !== "agency") {
    res.status(401).json({ message: "Agency authentication required." });
    return null;
  }

  return agencyId;
}

export async function getAgencyEarningsController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const sort =
      String(req.query?.sort || "").trim().toLowerCase() === "oldest"
        ? "oldest"
        : "newest";

    const result = await getAgencyEarnings({
      agencyId,
      search: req.query?.search || "",
      sort,
      page: req.query?.page || 1,
      limit: req.query?.limit || 30,
    });

    return res.json(result);
  } catch (err) {
    console.error("getAgencyEarningsController error", err);
    return res.status(500).json({ message: "Failed to fetch earnings." });
  }
}