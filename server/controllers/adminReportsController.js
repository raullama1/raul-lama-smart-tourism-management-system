// server/controllers/adminReportsController.js
import { getAdminReportsModel } from "../models/adminReportsModel.js";

export async function getAdminReportsController(req, res) {
  try {
    if (!req.user?.id || req.user?.role !== "admin") {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const data = await getAdminReportsModel();
    return res.json(data);
  } catch (err) {
    console.error("getAdminReportsController error", err);
    return res.status(500).json({ message: "Failed to load reports." });
  }
}