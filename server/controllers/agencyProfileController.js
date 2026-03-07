// server/controllers/agencyProfileController.js
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  clearAgencyProfileImage,
  findAgencyByName,
  findAgencyByPanVat,
  findAgencyByPhone,
  getAgencyPasswordHashById,
  getAgencyProfileById,
  setAgencyProfileImage,
  updateAgencyPasswordHashById,
  updateAgencyProfileById,
} from "../models/agencyProfileModel.js";

function getAgencyId(req, res) {
  const agencyId = req.user?.id;
  const role = req.user?.role;

  if (!agencyId || role !== "agency") {
    res.status(401).json({ message: "Agency authentication required." });
    return null;
  }

  return agencyId;
}

function deleteFileIfExists(relativePath) {
  if (!relativePath) return;

  const normalized = String(relativePath || "").replace(/^\/+/, "");
  const absPath = path.join(process.cwd(), "server", normalized);

  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
}

export async function getAgencyProfileController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const agency = await getAgencyProfileById(agencyId);

    if (!agency) {
      return res.status(404).json({ message: "Agency not found." });
    }

    return res.json({ agency });
  } catch (err) {
    console.error("getAgencyProfileController error", err);
    return res.status(500).json({ message: "Failed to load profile." });
  }
}

export async function updateAgencyProfileController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const address = String(req.body?.address || "").trim();
    const pan_vat = String(req.body?.pan_vat || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Agency name is required." });
    }

    if (!phone) {
      return res.status(400).json({ message: "Contact number is required." });
    }

    if (!address) {
      return res.status(400).json({ message: "Address is required." });
    }

    if (!pan_vat) {
      return res.status(400).json({ message: "PAN/VAT number is required." });
    }

    const nameExists = await findAgencyByName(name, agencyId);
    if (nameExists) {
      return res.status(400).json({ message: "Agency name already exists." });
    }

    const phoneExists = await findAgencyByPhone(phone, agencyId);
    if (phoneExists) {
      return res.status(400).json({ message: "Contact number already exists." });
    }

    const panVatExists = await findAgencyByPanVat(pan_vat, agencyId);
    if (panVatExists) {
      return res.status(400).json({ message: "PAN/VAT number already exists." });
    }

    const agency = await updateAgencyProfileById(agencyId, {
      name,
      phone,
      address,
      pan_vat,
    });

    return res.json({
      message: "Profile updated successfully.",
      agency,
    });
  } catch (err) {
    console.error("updateAgencyProfileController error", err);
    return res.status(500).json({ message: "Failed to update profile." });
  }
}

export async function uploadAgencyProfileImageController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    if (!req.file?.filename) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const agency = await getAgencyProfileById(agencyId);
    if (!agency) {
      return res.status(404).json({ message: "Agency not found." });
    }

    if (agency.profile_image) {
      deleteFileIfExists(agency.profile_image);
    }

    const relativePath = `/uploads/avatars/${req.file.filename}`;

    const updatedAgency = await setAgencyProfileImage(agencyId, relativePath);

    return res.json({
      message: "Profile image updated successfully.",
      agency: updatedAgency,
    });
  } catch (err) {
    console.error("uploadAgencyProfileImageController error", err);
    return res.status(500).json({ message: "Failed to upload profile image." });
  }
}

export async function removeAgencyProfileImageController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const agency = await getAgencyProfileById(agencyId);
    if (!agency) {
      return res.status(404).json({ message: "Agency not found." });
    }

    if (agency.profile_image) {
      deleteFileIfExists(agency.profile_image);
    }

    const updatedAgency = await clearAgencyProfileImage(agencyId);

    return res.json({
      message: "Profile image removed successfully.",
      agency: updatedAgency,
    });
  } catch (err) {
    console.error("removeAgencyProfileImageController error", err);
    return res.status(500).json({ message: "Failed to remove profile image." });
  }
}

export async function changeAgencyPasswordController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });
    }

    const passwordHash = await getAgencyPasswordHashById(agencyId);
    if (!passwordHash) {
      return res.status(404).json({ message: "Agency not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await updateAgencyPasswordHashById(agencyId, newHash);

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("changeAgencyPasswordController error", err);
    return res.status(500).json({ message: "Failed to update password." });
  }
}