// server/controllers/profileController.js
import fs from "fs";
import path from "path";
import { db } from "../db.js";

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

// GET /api/profile/me
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

// PUT /api/profile/me
export async function updateMyProfileController(req, res) {
  try {
    const userId = req.user?.id;
    const { name, phone } = req.body;

    const safeName = String(name || "").trim();
    if (!safeName) return res.status(400).json({ message: "Name is required." });

    const safePhone = typeof phone === "undefined" ? null : String(phone || "").trim();

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

// POST /api/profile/me/avatar (form-data: avatar)
export async function uploadProfileImageController(req, res) {
  try {
    const userId = req.user?.id;

    if (!req.file?.filename) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const [[oldRow]] = await db.query(
      `SELECT profile_image FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const oldValue = oldRow?.profile_image || null;

    if (oldValue) {
      const oldPath = oldValue.startsWith("uploads/")
        ? oldValue
        : path.join("uploads", "avatars", oldValue).replaceAll("\\", "/");

      const absOld = path.join(process.cwd(), "server", oldPath);
      if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
    }

    const relative = path
      .join("uploads", "avatars", req.file.filename)
      .replaceAll("\\", "/");

    await db.query(
      `
      UPDATE users
      SET profile_image = ?
      WHERE id = ?
      `,
      [relative, userId]
    );

    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    console.error("uploadProfileImageController error", err);
    res.status(500).json({ message: "Failed to upload profile image." });
  }
}

// DELETE /api/profile/me/avatar
export async function removeProfileImageController(req, res) {
  try {
    const userId = req.user?.id;

    const [[row]] = await db.query(
      `SELECT profile_image FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const current = row?.profile_image || null;

    if (current) {
      const rel = current.startsWith("uploads/")
        ? current
        : path.join("uploads", "avatars", current).replaceAll("\\", "/");

      const abs = path.join(process.cwd(), "server", rel);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
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
