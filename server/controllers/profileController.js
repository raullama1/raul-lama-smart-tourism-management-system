// server/controllers/profileController.js
import { db } from "../db.js";
import {
  uploadBufferToCloudinary,
  deleteCloudinaryImageByUrl,
} from "../utils/cloudinary.js";

function sanitizePhone(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

async function getUserById(userId) {
  const [rows] = await db.query(
    `
    SELECT id, name, email, phone, role, profile_image, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );
  return rows[0] || null;
}

export async function getMyProfileController(req, res) {
  try {
    const userId = req.user?.id;

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ user });
  } catch (err) {
    console.error("getMyProfileController error", err);
    res.status(500).json({ message: "Failed to load profile." });
  }
}

export async function updateMyProfileController(req, res) {
  try {
    const userId = req.user?.id;
    const { name, phone } = req.body;

    const safeName = String(name || "").trim();
    if (!safeName) return res.status(400).json({ message: "Name is required." });

    const safePhone =
      typeof phone === "undefined" ||
      phone === null ||
      String(phone).trim() === ""
        ? null
        : sanitizePhone(phone);

    await db.query(
      `
      UPDATE users
      SET name = ?, phone = ?
      WHERE id = ?
      `,
      [safeName, safePhone, userId]
    );

    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    console.error("updateMyProfileController error", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
}

export async function uploadProfileImageController(req, res) {
  try {
    const userId = req.user?.id;

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const [[oldRow]] = await db.query(
      `SELECT profile_image FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      "tourism-nepal/avatars",
      `u${userId}-${Date.now()}`
    );

    const newUrl = uploaded.secure_url;

    await db.query(
      `
      UPDATE users
      SET profile_image = ?
      WHERE id = ?
      `,
      [newUrl, userId]
    );

    if (oldRow?.profile_image) {
      await deleteCloudinaryImageByUrl(oldRow.profile_image);
    }

    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    console.error("uploadProfileImageController error", err);
    res.status(500).json({ message: "Failed to upload profile image." });
  }
}

export async function removeProfileImageController(req, res) {
  try {
    const userId = req.user?.id;

    const [[row]] = await db.query(
      `SELECT profile_image FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (row?.profile_image) {
      await deleteCloudinaryImageByUrl(row.profile_image);
    }

    await db.query(
      `
      UPDATE users
      SET profile_image = NULL
      WHERE id = ?
      `,
      [userId]
    );

    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    console.error("removeProfileImageController error", err);
    res.status(500).json({ message: "Failed to remove profile image." });
  }
}