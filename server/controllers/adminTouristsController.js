// server/controllers/adminTouristsController.js
import {
  getAdminTouristByIdModel,
  getAdminTouristsModel,
  updateAdminTouristBlockedStatusModel,
} from "../models/adminTouristsModel.js";

function requireAdminAuth(req, res) {
  if (!req.user?.id || req.user?.role !== "admin") {
    res.status(401).json({ message: "Admin authentication required." });
    return false;
  }
  return true;
}

export async function getAdminTouristsController(req, res) {
  try {
    if (!requireAdminAuth(req, res)) return;

    const q = String(req.query?.q || "").trim();
    const status = String(req.query?.status || "all").trim();
    const sort = String(req.query?.sort || "newest").trim();

    const tourists = await getAdminTouristsModel({ q, status, sort });

    return res.json({ tourists });
  } catch (err) {
    console.error("getAdminTouristsController error", err);
    return res.status(500).json({ message: "Failed to load tourists." });
  }
}

export async function getAdminTouristByIdController(req, res) {
  try {
    if (!requireAdminAuth(req, res)) return;

    const userId = Number(req.params?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Valid tourist id is required." });
    }

    const tourist = await getAdminTouristByIdModel(userId);
    if (!tourist) {
      return res.status(404).json({ message: "Tourist not found." });
    }

    return res.json({ tourist });
  } catch (err) {
    console.error("getAdminTouristByIdController error", err);
    return res.status(500).json({ message: "Failed to load tourist details." });
  }
}

export async function updateAdminTouristStatusController(req, res) {
  try {
    if (!requireAdminAuth(req, res)) return;

    const userId = Number(req.params?.userId);
    const isBlocked = req.body?.isBlocked;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Valid tourist id is required." });
    }

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ message: "isBlocked must be true or false." });
    }

    const result = await updateAdminTouristBlockedStatusModel(userId, isBlocked);

    if (!result?.affectedRows) {
      return res.status(404).json({ message: "Tourist not found." });
    }

    return res.json({
      message: isBlocked
        ? "Tourist blocked successfully."
        : "Tourist unblocked successfully.",
    });
  } catch (err) {
    console.error("updateAdminTouristStatusController error", err);
    return res.status(500).json({ message: "Failed to update tourist status." });
  }
}