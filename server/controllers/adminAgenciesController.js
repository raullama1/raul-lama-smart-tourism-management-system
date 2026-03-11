// server/controllers/adminAgenciesController.js
import {
  getAdminAgenciesModel,
  getAdminAgencyByIdModel,
  updateAdminAgencyBlockedStatusModel,
} from "../models/adminAgenciesModel.js";

function requireAdminAuth(req, res) {
  if (!req.user?.id || req.user?.role !== "admin") {
    res.status(401).json({ message: "Admin authentication required." });
    return false;
  }
  return true;
}

export async function getAdminAgenciesController(req, res) {
  try {
    if (!requireAdminAuth(req, res)) return;

    const q = String(req.query?.q || "").trim();
    const status = String(req.query?.status || "all").trim();
    const sort = String(req.query?.sort || "newest").trim();

    const agencies = await getAdminAgenciesModel({ q, status, sort });

    return res.json({ agencies });
  } catch (err) {
    console.error("getAdminAgenciesController error", err);
    return res.status(500).json({ message: "Failed to load agencies." });
  }
}

export async function getAdminAgencyByIdController(req, res) {
  try {
    if (!requireAdminAuth(req, res)) return;

    const agencyId = Number(req.params?.agencyId);
    if (!Number.isInteger(agencyId) || agencyId <= 0) {
      return res.status(400).json({ message: "Valid agency id is required." });
    }

    const agency = await getAdminAgencyByIdModel(agencyId);
    if (!agency) {
      return res.status(404).json({ message: "Agency not found." });
    }

    return res.json({ agency });
  } catch (err) {
    console.error("getAdminAgencyByIdController error", err);
    return res.status(500).json({ message: "Failed to load agency details." });
  }
}

export async function updateAdminAgencyStatusController(req, res) {
  try {
    if (!requireAdminAuth(req, res)) return;

    const agencyId = Number(req.params?.agencyId);
    const isBlocked = req.body?.isBlocked;

    if (!Number.isInteger(agencyId) || agencyId <= 0) {
      return res.status(400).json({ message: "Valid agency id is required." });
    }

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ message: "isBlocked must be true or false." });
    }

    const result = await updateAdminAgencyBlockedStatusModel(agencyId, isBlocked);

    if (!result?.affectedRows) {
      return res.status(404).json({ message: "Agency not found." });
    }

    return res.json({
      message: isBlocked
        ? "Agency blocked successfully."
        : "Agency unblocked successfully.",
    });
  } catch (err) {
    console.error("updateAdminAgencyStatusController error", err);
    return res.status(500).json({ message: "Failed to update agency status." });
  }
}